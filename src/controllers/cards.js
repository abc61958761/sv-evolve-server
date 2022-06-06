import HttpStatus from 'http-status-codes';
import * as xlsx from 'xlsx';

import * as cardService from '../services/cardService';

/**
 * QueryPurchaseRecords.
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
export function queryCards(req, res, next) {
  cardService
    .queryCards(req.query)
    .then((data) => res.status(HttpStatus.CREATED).json({ data }))
    .catch((err) => next(err));
}

/**
 * CreateCard.
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
export function createCard(req, res, next) {
  cardService
    .createCard(req.body)
    .then((data) => res.status(HttpStatus.CREATED).json({ data }))
    .catch((err) => next(err));
}

/**
 * Upload file.
 *
 * @param {*} req
 * @param {*} res
 */
export async function uploadFile(req, res) {
  const file = req.files.file;

  const wb = xlsx.read(file.data, { type: 'buffer', sheetStubs: true });
  const headers = {};
  const result = [];
  let temp = {
    version: null,
    code: null,
    consumption: null,
    describe: null,
    level: null,
    name: null,
    profession: null,
    type: null
  };

  const insertData = [];

  for (const sheetName of wb.SheetNames) {
    for (const [key, value] of Object.entries(wb.Sheets[sheetName])) {
      const col = key.substring(0, 1);
      const row = parseInt(key.substring(1));

      if (row === 1) {
        headers[col] = value.v;
        continue;
      }

      temp[headers[col]] = value.v !== 'null' ? value.v : null;
      if (col === 'I' && temp.code) {
        insertData.push(temp);
        temp = {
          version: null,
          code: null,
          consumption: null,
          describe: null,
          level: null,
          name: null,
          profession: null,
          type: null
        };
      }
    }
  }

  /* eslint-disable no-await-in-loop */
  const promises = await insertData.map((data) => {
    return cardService.createCard(data);
  });

  await Promise.all(promises);

  res.json(result);
}

/**
 * CreateCards.
 *
 * @param {*} req
 * @param {*} res
 */
export async function createCards(req, res) {
  const cards = req.body;
  const result = [];

  for (const card of cards) {
    const response = await cardService.createCard(card);

    result.push(response);
  }

  res.json(result);
}

/**
 * Update Cards.
 *
 * @param {*} req
 * @param {*} res
 */
export async function updateCard(req, res) {
  const { code, params } = req.body;

  const response = await cardService.updateCard(code, params);

  res.json(response);
}
