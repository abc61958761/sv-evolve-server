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
                price: 0,
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
    const newRecord = {
      ...record,
      purchase_id: purchase.id
    };

    return new PurchaseRecord(newRecord).save();
  });
  const newPurchaseRecords = await Promise.all(purchaseRecords);

  /* eslint-disable no-await-in-loop */
  for (const record of newPurchaseRecord.purchaseRecords) {
    const inventory = await Inventory.where({ pokemon_id: record.pokemon_id }).fetch({ require: true });
    const newCount = parseInt(record.count) + parseInt(inventory.attributes.count);
    const newPrice = Math.floor(
      (parseInt(record.price) * parseInt(record.count) +
        parseInt(inventory.attributes.count) * parseInt(inventory.attributes.price)) /
        newCount
    );
    const newInventoryParams = {
      count: newCount,
      price: newPrice,
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
  const sold = await new Sold(newSoldRecord.sold).save();

  const soldRecordPromise = newSoldRecord.soldRecords.map((record) => {
    const newRecord = {
      ...record,
      sold_id: sold.id
    };

    return new SoldRecord(newRecord).save();
  });
  const newSoldRecords = await Promise.all(soldRecordPromise);

  /* eslint-disable no-await-in-loop */
  for (const record of newSoldRecord.soldRecords) {
    const inventory = await Inventory.where({ pokemon_id: record.pokemon_id }).fetch({ require: true });
    const newCount = parseInt(inventory.attributes.count) - parseInt(record.count);
    const newPrice =
      Math.floor((inventory.attributes.count * inventory.attributes.price - record.count * record.price) / newCount) ||
      0;

    const newInventoryParams = {
      count: newCount,
      price: newPrice,
      updated_at: new Date()
    };

    await new Inventory({ id: inventory.id }).save(newInventoryParams);
  }

  return {
    sold,
    soldRecords: newSoldRecords
  };
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
      'purchases.splice',
      'purchases.purchaser',
      'purchases.date',
      'purchase_records.purchase_id',
      'purchase_records.count',
      'purchase_records.price',
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
          splice: item.splice,
          purchaser: item.purchaser,
          date: item.date,
          price: 0
        },
        purchase_records: []
      };
    }
    tempData[item.purchase_id].purchase_records.push({
      record: {
        id: item.purchase_record_id,
        count: item.count,
        price: item.price
      },
      pokemon: {
        id: item.pokemon_id,
        name: item.pokemon_name
      }
    });
    tempData[item.purchase_id].purchase.price += item.price * item.count;
  }

  return Object.values(tempData).map((item) => item);
}

/**
 * QueryInventories.
 *
 * @returns
 */
export function queryInventories() {
  return new Inventory().fetchAll({ withRelated: ['pokemon'] }).then((inventories) => inventories);
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
      'solds.splice',
      'solds.date',
      'solds.payee',
      'solds.sales_channel',
      'sold_records.sold_id',
      'sold_records.count',
      'sold_records.price',
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
          splice: item.splice,
          date: item.date,
          price: 0,
          payee: item.payee,
          salesChannel: item.sales_channel
        },
        sold_records: []
      };
    }
    tempData[item.sold_id].sold_records.push({
      record: {
        id: item.purchase_record_id,
        count: item.count,
        price: item.price
      },
      pokemon: {
        id: item.pokemon_id,
        name: item.pokemon_name
      }
    });
    tempData[item.sold_id].sold.price += item.price * item.count;
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
 * @param {*} param0
 * @returns
 */
export async function deletePurchaseRecords({ ids }) {
  const data = await knex.transaction(function (t) {
    const purchasePrmoises = ids.map((id) => {
      return knex('purchases')
        .transacting(t)
        .where({ id })
        .update({ status: 'inactive' }, ['id'])
        .then(function (purchases) {
          const recordPromises = purchases.map((purchase) => {
            return knex('purchase_records')
              .transacting(t)
              .where({ purchase_id: purchase.id })
              .update({ status: 'inactive' }, ['id', 'pokemon_id', 'count', 'price'])
              .then((purchaseRecords) => {
                const inventoryPrmoise = purchaseRecords.map(async (purchaseRecord) => {
                  const inventory = await knex('inventories')
                    .transacting(t)
                    .where({ pokemon_id: purchaseRecord.pokemon_id })
                    .first();

                  const newCount = inventory.count - purchaseRecord.count;
                  const newPrice =
                    Math.floor(
                      (inventory.price * inventory.count - purchaseRecord.price * purchaseRecord.count) / newCount
                    ) || 0;

                  return knex('inventories')
                    .transacting(t)
                    .where({ pokemon_id: purchaseRecord.pokemon_id })
                    .update({ price: newPrice, count: newCount });
                });

                return Promise.all(inventoryPrmoise).then((inventories) => inventories);
              });
          });

          return Promise.all(recordPromises).then((records) => {
            return { records };
          });
        });
    });

    return Promise.all(purchasePrmoises).then((purchase) => {
      return { purchase };
    });
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
  const data = await knex.transaction(function (t) {
    const soldPrmoises = ids.map((id) => {
      return knex('solds')
        .transacting(t)
        .where({ id })
        .update({ status: 'inactive' }, ['id'])
        .then(function (solds) {
          const recordPromises = solds.map((sold) => {
            return knex('sold_records')
              .transacting(t)
              .where({ sold_id: sold.id })
              .update({ status: 'inactive' }, ['id', 'pokemon_id', 'count', 'price'])
              .then((soldRecords) => {
                const inventoryPrmoise = soldRecords.map(async (soldRecord) => {
                  const inventory = await knex('inventories')
                    .transacting(t)
                    .where({ pokemon_id: soldRecord.pokemon_id })
                    .first();
                  const newCount = inventory.count + soldRecord.count;
                  const newPrice = Math.floor(
                    (inventory.price * inventory.count + soldRecord.price * soldRecord.count) / newCount
                  );

                  return knex('inventories')
                    .transacting(t)
                    .where({ pokemon_id: soldRecord.pokemon_id })
                    .update({ price: newPrice, count: newCount });
                });

                return Promise.all(inventoryPrmoise).then((inventories) => inventories);
              });
          });

          return Promise.all(recordPromises).then((records) => {
            return { records };
          });
        });
    });

    return Promise.all(soldPrmoises).then((sold) => {
      return { sold };
    });
  });

  return data;
}
