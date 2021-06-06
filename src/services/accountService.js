import Boom from '@hapi/boom';
import { uuid } from 'uuidv4';

import { knex } from '../db';
import Pokemon from '../models/pokemon';
import Purchase from '../models/purchase';
import PurchaseRecord from '../models/purchase_record';
import Inventory from '../models/inventory';
import Sold from '../models/sold';
import SoldRecord from '../models/sold_record';

/**
 * CreatePokemon.
 *
 * @param {*} newPokemon
 * @returns
 */
export function createPokemon(newPokemon) {
  return knex
    .select('pokemons.name')
    .from('pokemons')
    .where({ name: newPokemon.name })
    .then(function (pokemon) {
      if (pokemon.length === 0) {
        return knex.transaction(function (t) {
          const pokemonId = uuid();

          return knex('pokemons')
            .transacting(t)
            .insert({ ...newPokemon, id: pokemonId })
            .then(function () {
              return knex('inventories').transacting(t).insert({
                id: uuid(),
                count: 0,
                total_price: 0,
                pokemon_id: pokemonId
              });
            })
            .then(t.commit)
            .catch(t.rollback);
        });
      }
      throw Boom.notFound('User not found');
    });
}

/**
 * CreatePurchaseRecord.
 *
 * @param {*} newPurchaseRecord
 * @returns
 */
export async function createPurchaseRecord(newPurchaseRecord) {
  const purchase = await new Purchase(newPurchaseRecord.purchase).save();

  const purchaseRecords = newPurchaseRecord.purchaseRecords.map((record) => {
    const total_price = record.price * record.count;
    const pokemon_id = record.pokemon.id;
    delete record.price;
    delete record.pokemon;

    const newRecord = {
      ...record,
      purchase_id: purchase.id,
      total_price,
      pokemon_id,
      date: newPurchaseRecord.purchase.date
    };

    return new PurchaseRecord(newRecord).save();
  });
  const newPurchaseRecords = await Promise.all(purchaseRecords);

  /* eslint-disable no-await-in-loop */
  for (const record of newPurchaseRecords) {
    const inventory = await Inventory.where({ pokemon_id: record.attributes.pokemon_id }).fetch({ require: true });
    const newCount = parseInt(record.attributes.count) + parseInt(inventory.attributes.count);
    const newTotalPrice = parseInt(record.attributes.total_price) + parseInt(inventory.attributes.total_price);
    const newInventoryParams = {
      count: newCount,
      total_price: newTotalPrice,
      updated_at: new Date()
    };

    await new Inventory({ id: inventory.id }).save(newInventoryParams);
  }

  return {
    purchase,
    purchaseRecords: newPurchaseRecords
  };
}

/**
 * CreateSoldRecord.
 *
 * @param {*} newSoldRecord
 * @returns
 */
export async function createSoldRecord(newSoldRecord) {
  const data = await knex.transaction(async function (t) {
    const createdSold = await knex('solds')
      .transacting(t)
      .insert({ ...newSoldRecord.sold, id: uuid() })
      .returning(['id'])
      .then(async (sold) => {
        const soldRecords = newSoldRecord.soldRecords.map((record) => {
          const total_price = record.price * record.count;
          delete record.price;

          const pokemon_id = record.pokemon.id;
          delete record.pokemon;

          return {
            ...record,
            sold_id: sold[0].id,
            total_price,
            date: newSoldRecord.sold.date,
            pokemon_id,
            id: uuid()
          };
        });

        const createRecords = await knex('sold_records')
          .transacting(t)
          .insert(soldRecords)
          .returning(['id', 'pokemon_id', 'count', 'total_price']);
        return {
          sold,
          records: createRecords
        };
      });

    /* eslint-disable no-await-in-loop */
    for (const record of createdSold.records) {
      const inventory = await knex('inventories').where({ pokemon_id: record.pokemon_id }).first();
      const newCount = parseInt(inventory.count) - parseInt(record.count);
      if (newCount < 0) throw Boom.badRequest('Error Counts');
      const newTotalPrice = parseInt(inventory.total_price) - parseInt(record.total_price);

      const newInventoryParams = {
        id: uuid(),
        count: newCount,
        total_price: newTotalPrice,
        updated_at: new Date()
      };

      await knex('inventories').transacting(t).where({ id: inventory.id }).update(newInventoryParams);
    }

    return createdSold;
  });

  return data;
}

/**
 * QueryPurchaseRecords.
 *
 * @returns
 */
export async function queryPurchaseRecords() {
  const data = await knex('purchases')
    .select([
      knex.ref('purchase_records.id').as('purchase_record_id'),
      knex.ref('purchases.name').as('purchase_name'),
      knex.ref('purchases.status').as('purchase_status'),
      'purchases.purchaser',
      'purchases.date',
      'purchases.split',
      'purchase_records.purchase_id',
      'purchase_records.count',
      'purchase_records.total_price',
      'purchase_records.pokemon_id',
      knex.ref('pokemons.name').as('pokemon_name')
    ])
    .join('purchase_records', function () {
      this.on('purchases.id', '=', 'purchase_records.purchase_id');
      this.andOnVal('purchases.status', '=', 'active');
    })
    .join('pokemons', 'purchase_records.pokemon_id', '=', 'pokemons.id');

  const tempData = {};

  for (const item of data) {
    if (!tempData[item.purchase_id]) {
      tempData[item.purchase_id] = {
        purchase: {
          id: item.purchase_id,
          name: item.purchase_name,
          purchaser: item.purchaser,
          date: item.date,
          total_price: 0,
          split: item.split
        },
        purchase_records: []
      };
    }
    tempData[item.purchase_id].purchase_records.push({
      record: {
        id: item.purchase_record_id,
        count: item.count,
        total_price: item.total_price
      },
      pokemon: {
        id: item.pokemon_id,
        name: item.pokemon_name
      }
    });
    tempData[item.purchase_id].purchase.total_price += item.total_price;
  }

  return Object.values(tempData).map((item) => item);
}

/**
 * QueryInventories.
 *
 * @returns
 */
export async function queryInventories(params) {
  if (params.name) {
    let query = knex('pokemons');
    query = query.where('name', 'like', `%${params.name}%`);
    const pokemons = await query.select();

    const inventoryPromises = pokemons.map(async (pokemon) => {
      return await knex('inventories')
        .where({ pokemon_id: pokemon.id })
        .then((inventories) => {
          return {
            ...inventories,
            pokemon
          };
        });
    });

    return await Promise.all(inventoryPromises);
  } else {
    return new Inventory().fetchAll({ withRelated: ['pokemon'] }).then((inventories) => inventories);
  }
}

/**
 * QuerySoldRecords.
 *
 * @returns
 */
export async function querySoldRecords() {
  const data = await knex('solds')
    .select([
      knex.ref('sold_records.id').as('sold_record_id'),
      knex.ref('solds.name').as('sold_name'),
      'solds.date',
      'solds.payee',
      'solds.split',
      'solds.sales_channel',
      'sold_records.sold_id',
      'sold_records.count',
      'sold_records.total_price',
      'sold_records.pokemon_id',
      knex.ref('pokemons.name').as('pokemon_name')
    ])
    .join('sold_records', function () {
      this.on('solds.id', '=', 'sold_records.sold_id');
      this.andOnVal('solds.status', '=', 'active');
    })
    .join('pokemons', 'sold_records.pokemon_id', '=', 'pokemons.id');

  const tempData = {};

  for (const item of data) {
    if (!tempData[item.sold_id]) {
      tempData[item.sold_id] = {
        sold: {
          id: item.sold_id,
          name: item.sold_name,
          date: item.date,
          total_price: 0,
          payee: item.payee,
          salesChannel: item.sales_channel,
          split: item.split
        },
        sold_records: []
      };
    }
    tempData[item.sold_id].sold_records.push({
      record: {
        id: item.purchase_record_id,
        count: item.count,
        total_price: item.total_price
      },
      pokemon: {
        id: item.pokemon_id,
        name: item.pokemon_name
      }
    });
    tempData[item.sold_id].sold.total_price += item.total_price;
  }

  return Object.values(tempData).map((item) => item);
}

/**
 * QueryPokemons.
 *
 * @param {*} params
 * @returns
 */
export function queryPokemons(params) {
  let query = knex('pokemons');

  if (params.name) {
    query = query.where('name', 'like', `%${params.name}%`);
  }

  return query.select();
}

/**
 * UpdatePokemon.
 *
 * @param {*} id
 * @param {*} params
 * @returns
 */
export function updatePokemon(id, params) {
  return new Pokemon({ id }).save(params);
}

/**
 * DeletePurchaseRecords.
 *
 * @param {*} param
 * @returns
 */
export async function deletePurchaseRecords({ ids }) {
  const dateTemp = {};
  const data = await knex.transaction(async function (t) {
    /* eslint-disable no-await-in-loop */
    for (const id of ids) {
      await knex('purchases')
        .transacting(t)
        .where({ id })
        .update({ status: 'inactive' }, ['id', 'date', 'settlement', 'purchaser'])
        .then(async function (purchases) {
          const recordPromises = purchases.map((purchase) => {
            let date = null;
            if (purchase.settlement) {
              if (purchase.date.getMonth() + 1 < 10) {
                date = `${purchase.date.getFullYear()}-0${purchase.date.getMonth() + 1}`;
              } else {
                date = `${purchase.date.getFullYear()}-${purchase.date.getMonth() + 1}-01`;
              }

              if (!dateTemp[date]) {
                dateTemp[date] = {
                  chad_purchase_price: 0,
                  carol_purchase_price: 0
                };
              }
            }

            return knex('purchase_records')
              .transacting(t)
              .where({ purchase_id: purchase.id })
              .update({ status: 'inactive' }, ['id', 'pokemon_id', 'count', 'total_price'])
              .then((purchaseRecords) => {
                const inventoryPrmoise = purchaseRecords.map(async (purchaseRecord) => {
                  if (purchase.settlement) {
                    if (purchase.purchaser === 'Chad') {
                      dateTemp[date].chad_purchase_price += purchaseRecord.total_price;
                    } else {
                      dateTemp[date].carol_purchase_price += purchaseRecord.total_price;
                    }
                  }

                  const inventory = await knex('inventories')
                    .transacting(t)
                    .where({ pokemon_id: purchaseRecord.pokemon_id })
                    .first();

                  const newCount = inventory.count - purchaseRecord.count;
                  const newTotalPrice = inventory.total_price - purchaseRecord.total_price;
                  return knex('inventories')
                    .transacting(t)
                    .where({ pokemon_id: purchaseRecord.pokemon_id })
                    .update({ total_price: newTotalPrice, count: newCount });
                });

                return Promise.all(inventoryPrmoise).then((inventories) => inventories);
              });
          });
          const record = await Promise.all(recordPromises);
          return {
            purchases,
            record
          };
        });
    }

    const settlementPromises = Object.keys(dateTemp).map(async (item) => {
      const month = new Date(item).getMonth() + 1;
      const year = new Date(item).getFullYear();

      const settlement = await knex('settlements').where({ month, year }).first();
      const updateParams = {
        chad_purchase_price: settlement.chad_purchase_price - dateTemp[item].chad_purchase_price,
        carol_purchase_price: settlement.carol_purchase_price - dateTemp[item].carol_purchase_price
      };

      return knex('settlements').transacting(t).where({ id: settlement.id }).update(updateParams);
    });

    return await Promise.all(settlementPromises);
  });

  return data;
}

/**
 * DeleteSoldRecords.
 *
 * @param {*} param0
 * @returns
 */
export async function deleteSoldRecords({ ids }) {
  const dateTemp = {};
  const data = await knex.transaction(async function (t) {
    /* eslint-disable no-await-in-loop */
    for (const id of ids) {
      await knex('solds')
        .transacting(t)
        .where({ id })
        .update({ status: 'inactive' }, ['id', 'date', 'settlement', 'payee'])
        .then(async function (solds) {
          const recordPromises = solds.map((sold) => {
            let date = null;
            if (sold.settlement) {
              if (sold.date.getMonth() + 1 < 10) {
                date = `${sold.date.getFullYear()}-0${sold.date.getMonth() + 1}`;
              } else {
                date = `${sold.date.getFullYear()}-${sold.date.getMonth() + 1}-01`;
              }

              if (!dateTemp[date]) {
                dateTemp[date] = {
                  chad_sold_price: 0,
                  carol_sold_price: 0
                };
              }
            }

            return knex('sold_records')
              .transacting(t)
              .where({ sold_id: sold.id })
              .update({ status: 'inactive' }, ['id', 'pokemon_id', 'count', 'total_price'])
              .then((soldRecords) => {
                const inventoryPrmoise = soldRecords.map(async (soldRecord) => {
                  if (sold.settlement) {
                    if (sold.payee === 'Chad') {
                      dateTemp[date].chad_sold_price += soldRecord.total_price;
                    } else {
                      dateTemp[date].carol_sold_price += soldRecord.total_price;
                    }
                  }

                  const inventory = await knex('inventories')
                    .transacting(t)
                    .where({ pokemon_id: soldRecord.pokemon_id })
                    .first();
                  const newCount = inventory.count + soldRecord.count;
                  const newTotalPrice = inventory.total_price + soldRecord.total_price;

                  return knex('inventories')
                    .transacting(t)
                    .where({ pokemon_id: soldRecord.pokemon_id })
                    .update({ total_price: newTotalPrice, count: newCount });
                });

                return Promise.all(inventoryPrmoise).then((inventories) => inventories);
              });
          });

          const record = await Promise.all(recordPromises);
          return {
            solds,
            record
          };
        });
    }

    const settlementPromises = Object.keys(dateTemp).map(async (item) => {
      const month = new Date(item).getMonth() + 1;
      const year = new Date(item).getFullYear();

      const settlement = await knex('settlements').transacting(t).where({ month, year }).first();
      const updateParams = {
        chad_sold_price: settlement.chad_sold_price - dateTemp[item].chad_sold_price,
        carol_sold_price: settlement.carol_sold_price - dateTemp[item].carol_sold_price
      };

      return knex('settlements').where({ id: settlement.id }).update(updateParams);
    });

    return Promise.all(settlementPromises);
  });

  return data;
}

export async function updateSettlementRecords({ params }) {
  const transactionPromises = params.map((param) => {
    return knex.transaction(async function (t) {
      let chad_purchase_price = 0,
        chad_sold_price = 0,
        carol_purchase_price = 0,
        carol_sold_price = 0;

      await knex('purchases')
        .transacting(t)
        .andWhereRaw(`EXTRACT(YEAR FROM date::date) = ?`, [param.year])
        .andWhereRaw(`EXTRACT(MONTH FROM date::date) = ?`, [param.month])
        .where({ status: 'active', purchaser: 'Chad' })
        .update({ settlement: true }, ['id'])
        .then((purchases) => {
          const purchaseRecordPromises = purchases.map((purchase) => {
            return knex('purchase_records')
              .where({ purchase_id: purchase.id })
              .update({ settlement: true }, ['id', 'total_price']);
          });
          return Promise.all(purchaseRecordPromises).then((purchaseRecords) => {
            for (const purchaseRecord of purchaseRecords) {
              for (const record of purchaseRecord) {
                chad_purchase_price += record.total_price;
              }
            }

            return purchaseRecords;
          });
        });

      await knex('solds')
        .transacting(t)
        .andWhereRaw(`EXTRACT(YEAR FROM date::date) = ?`, [param.year])
        .andWhereRaw(`EXTRACT(MONTH FROM date::date) = ?`, [param.month])
        .where({ status: 'active', payee: 'Chad' })
        .update({ settlement: true }, ['id'])
        .then((solds) => {
          const soldRecordPromises = solds.map((sold) => {
            return knex('sold_records').where({ sold_id: sold.id }).update({ settlement: true }, ['id', 'total_price']);
          });
          return Promise.all(soldRecordPromises).then((soldRecords) => {
            for (const soldRecord of soldRecords) {
              for (const record of soldRecord) {
                chad_sold_price += record.total_price;
              }
            }

            return soldRecords;
          });
        });

      await knex('purchases')
        .transacting(t)
        .andWhereRaw(`EXTRACT(YEAR FROM date::date) = ?`, [param.year])
        .andWhereRaw(`EXTRACT(MONTH FROM date::date) = ?`, [param.month])
        .where({ status: 'active', purchaser: 'Carol' })
        .update({ settlement: true }, ['id'])
        .then((purchases) => {
          const purchaseRecordPromises = purchases.map((purchase) => {
            return knex('purchase_records')
              .where({ purchase_id: purchase.id })
              .update({ settlement: true }, ['id', 'total_price']);
          });
          return Promise.all(purchaseRecordPromises).then((purchaseRecords) => {
            for (const purchaseRecord of purchaseRecords) {
              for (const record of purchaseRecord) {
                carol_purchase_price += record.total_price;
              }
            }

            return purchaseRecords;
          });
        });

      await knex('solds')
        .transacting(t)
        .andWhereRaw(`EXTRACT(YEAR FROM date::date) = ?`, [param.year])
        .andWhereRaw(`EXTRACT(MONTH FROM date::date) = ?`, [param.month])
        .where({ status: 'active', payee: 'Carol' })
        .update({ settlement: true }, ['id'])
        .then((solds) => {
          const soldRecordPromises = solds.map((sold) => {
            return knex('sold_records').where({ sold_id: sold.id }).update({ settlement: true }, ['id', 'total_price']);
          });
          return Promise.all(soldRecordPromises).then((soldRecords) => {
            for (const soldRecord of soldRecords) {
              for (const record of soldRecord) {
                carol_sold_price += record.total_price;
              }
            }

            return soldRecords;
          });
        });

      let settlementData = null;
      const querySettlement = await knex('settlements').where({ month: param.month, year: param.year }).first();

      if (!querySettlement) {
        settlementData = await knex('settlements').insert({
          id: uuid(),
          month: param.month,
          year: param.year,
          chad_purchase_price,
          chad_sold_price,
          carol_purchase_price,
          carol_sold_price
        });
      } else {
        settlementData = await knex('settlements').where({ id: querySettlement.id }).update({
          chad_purchase_price,
          chad_sold_price,
          carol_purchase_price,
          carol_sold_price
        });
      }

      return settlementData;
    });
  });

  const data = await Promise.all(transactionPromises);

  return data;
}

export async function queryRecordTotalByUnsettlement() {
  const purchaseRecords = await knex('purchase_records')
    .where({ settlement: false, status: 'active' })
    .orderBy('date', 'desc');

  const result = {};
  for (const record of purchaseRecords) {
    const month = record.date.getUTCMonth() + 1;
    const year = record.date.getUTCFullYear();
    const key = `${month}`;
    if (!result[key]) {
      result[key] = {
        year,
        month,
        purchase: 0,
        sold: 0
      };
    }
    result[key].purchase += record.total_price;
  }

  const soldRecords = await knex('sold_records').where({ settlement: false, status: 'active' }).orderBy('date', 'desc');

  for (const record of soldRecords) {
    const month = record.date.getUTCMonth() + 1;
    const year = record.date.getUTCFullYear();
    const key = `${month}`;
    if (!result[key]) {
      result[key] = {
        year,
        month,
        purchase: 0,
        sold: 0
      };
    }
    result[key].sold += record.total_price;
  }

  return result;
}

export async function querySettlements() {
  const settlements = await knex('settlements').orderBy('year', 'desc').orderBy('month', 'desc');
  return settlements;
}

export async function getUnsettlementDetail({ year, month }) {
  let chad_purchase_price = 0,
    chad_sold_price = 0,
    carol_purchase_price = 0,
    carol_sold_price = 0;
  await knex('purchases')
    .andWhereRaw(`EXTRACT(YEAR FROM date::date) = ?`, [year])
    .andWhereRaw(`EXTRACT(MONTH FROM date::date) = ?`, [month])
    .where({ status: 'active', purchaser: 'Chad' })
    .then((purchases) => {
      const purchaseRecordPromises = purchases.map((purchase) => {
        return knex('purchase_records').where({ purchase_id: purchase.id });
      });
      return Promise.all(purchaseRecordPromises).then((purchaseRecords) => {
        for (const purchaseRecord of purchaseRecords) {
          for (const record of purchaseRecord) {
            chad_purchase_price += record.total_price;
          }
        }

        return purchaseRecords;
      });
    });

  await knex('solds')
    .andWhereRaw(`EXTRACT(YEAR FROM date::date) = ?`, [year])
    .andWhereRaw(`EXTRACT(MONTH FROM date::date) = ?`, [month])
    .where({ status: 'active', payee: 'Chad' })
    .then((solds) => {
      const soldRecordPromises = solds.map((sold) => {
        return knex('sold_records').where({ sold_id: sold.id });
      });
      return Promise.all(soldRecordPromises).then((soldRecords) => {
        for (const soldRecord of soldRecords) {
          for (const record of soldRecord) {
            chad_sold_price += record.total_price;
          }
        }

        return soldRecords;
      });
    });

  await knex('purchases')
    .andWhereRaw(`EXTRACT(YEAR FROM date::date) = ?`, [year])
    .andWhereRaw(`EXTRACT(MONTH FROM date::date) = ?`, [month])
    .where({ status: 'active', purchaser: 'Carol' })
    .then((purchases) => {
      const purchaseRecordPromises = purchases.map((purchase) => {
        return knex('purchase_records').where({ purchase_id: purchase.id });
      });
      return Promise.all(purchaseRecordPromises).then((purchaseRecords) => {
        for (const purchaseRecord of purchaseRecords) {
          for (const record of purchaseRecord) {
            carol_purchase_price += record.total_price;
          }
        }

        return purchaseRecords;
      });
    });

  await knex('solds')
    .andWhereRaw(`EXTRACT(YEAR FROM date::date) = ?`, [year])
    .andWhereRaw(`EXTRACT(MONTH FROM date::date) = ?`, [month])
    .where({ status: 'active', payee: 'Carol' })
    .update({ settlement: true }, ['id'])
    .then((solds) => {
      const soldRecordPromises = solds.map((sold) => {
        return knex('sold_records').where({ sold_id: sold.id }).update({ settlement: true }, ['id', 'total_price']);
      });
      return Promise.all(soldRecordPromises).then((soldRecords) => {
        for (const soldRecord of soldRecords) {
          for (const record of soldRecord) {
            carol_sold_price += record.total_price;
          }
        }

        return soldRecords;
      });
    });

  return {
    year,
    month,
    chad_purchase_price,
    chad_sold_price,
    carol_purchase_price,
    carol_sold_price
  };
}
export async function getSettlementDetail({ year, month }) {
  const settlement = knex('settlements').where({ year, month }).first();

  return settlement;
}

export async function updatePurchaseRecordsById(id, params) {
  const purchase = await knex('purchases')
    .where({ id })
    .first()
    .update(params, ['id'])
    .then((item) => {
      return knex('purchase_records').where({ purchase_id: item[0].id }).update(params, ['id']);
    });

  return purchase;
}

export async function updatePurchaseRecordsByDate(params) {
  const purchases = await knex('purchases')
    .andWhereRaw(`EXTRACT(YEAR FROM date::date) = ?`, [params.date.year])
    .andWhereRaw(`EXTRACT(MONTH FROM date::date) = ?`, [params.date.month])
    .update({ split: params.split }, ['id'])
    .then((items) => {
      const purchaseRecordPromises = items.map((purchase) => {
        return knex('purchase_records').where({ purchase_id: purchase.id }).update({ split: params.split }, ['id']);
      });

      return Promise.all(purchaseRecordPromises);
    });

  return purchases;
}

export async function updateSoldRecordsById(id, params) {
  const sold = await knex('solds')
    .where({ id })
    .first()
    .update(params, ['id'])
    .then((item) => {
      return knex('sold_records').where({ sold_id: item.id }).update(params, ['id']);
    });

  return sold;
}

export async function updateSoldRecordsByDate(params) {
  const solds = await knex('solds')
    .andWhereRaw(`EXTRACT(YEAR FROM date::date) = ?`, [params.date.year])
    .andWhereRaw(`EXTRACT(MONTH FROM date::date) = ?`, [params.date.month])
    .update({ split: params.split }, ['id'])
    .then((items) => {
      const soldRecordPromises = items.map((sold) => {
        return knex('sold_records').where({ sold_id: sold.id }).update({ split: params.split }, ['id']);
      });

      return Promise.all(soldRecordPromises);
    });

  return solds;
}

export async function getUnsplitPurchasesByDate(date) {
  const purchases = await knex('purchases')
    .andWhereRaw(`EXTRACT(YEAR FROM date::date) = ?`, [date.year])
    .andWhereRaw(`EXTRACT(MONTH FROM date::date) = ?`, [date.month])
    .where({ split: false, status: 'active' })
    .then((items) => {
      const result = items.map(async (purchase) => {
        const records = await knex('purchase_records').where({ purchase_id: purchase.id, split: false });
        let total_price = 0;
        for (const record of records) {
          total_price = record.total_price;
        }
        return {
          ...purchase,
          total_price
        };
      });

      return Promise.all(result);
    });

  return purchases;
}

export async function getUnsplitSoldsByDate(date) {
  const solds = await knex('solds')
    .andWhereRaw(`EXTRACT(YEAR FROM date::date) = ?`, [date.year])
    .andWhereRaw(`EXTRACT(MONTH FROM date::date) = ?`, [date.month])
    .where({ split: false, status: 'active' })
    .then((items) => {
      const result = items.map(async (sold) => {
        const records = await knex('sold_records').where({ sold_id: sold.id, split: false });
        let total_price = 0;
        for (const record of records) {
          total_price = record.total_price;
        }
        return {
          ...sold,
          total_price
        };
      });

      return Promise.all(result);
    });

  return solds;
}
