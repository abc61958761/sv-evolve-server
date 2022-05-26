// import Boom from '@hapi/boom';
import { v4 as uuidv4 } from 'uuid';

import { knex } from '../db';

/**
 * QueryCards.
 *
 * @param {*} params
 * @returns
 */
export function queryCards(params) {
  let query = knex('cards');

  if (params.name) {
    query = query.where('name', 'like', `%${params.name}%`);
  }
  if (params.code) {
    query = query.where('code', params.code);
  }

  if (params.professions && params.professions.length > 0) {
    const professions = params.professions.split(',');

    query = query.whereIn('profession', professions);
  }
  if (params.consumptions && params.consumptions.length > 0) {
    const consumptions = params.consumptions.split(',');

    query = query.whereIn('consumption', consumptions);
  }
  if (params.version) {
    query = query.where('version', params.version);
  }
  if (params.limit) {
    query = query.limit(params.limit);
  }
  if (params.offset) {
    query = query.offset(params.offset);
  }

  return query.select();
}

/**
 * CreateCard.
 *
 * @param {*} newCard
 * @returns
 */
export function createCard(newCard) {
  return knex('cards').insert({
    id: uuidv4(),
    code: newCard.code,
    name: newCard.name,
    consumption: newCard.consumption,
    profession: newCard.profession,
    type: newCard.type,
    level: newCard.level,
    version: newCard.version,
    describe: newCard.describe
  });
}
