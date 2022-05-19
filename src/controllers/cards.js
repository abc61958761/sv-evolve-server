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

export async function uploadFile(req, res) {
  let file = req.files.file;

  let wb= xlsx.read(file.data, {type: "buffer", sheetStubs: true});
  const headers = {}

  let temp = {
      "code": null,
      "consumption": null,
      "describe": null,
      "level": null,
      "name": null,
      "profession": null,
      "type": null
  }

  for(const sheetName of wb.SheetNames) {
    for (const [key, value] of Object.entries(wb.Sheets[sheetName])) {

      var col = key.substring(0,1);
      var row = parseInt(key.substring(1));
      if(row == 1) {
          headers[col] = value.v;
          continue;
      }

      temp[headers[col]] = value.v !== "null" ? value.v : null;

      if (col == "H" && temp.code) {
        const response = await cardService.createCard(temp);
        temp = {
            "code": null,
            "consumption": null,
            "describe": null,
            "level": null,
            "name": null,
            "profession": null,
            "type": null
        }
      }
    }
  }

  res.json(null);
}

/**
 * CreatePurchaseRecord.
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
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
 * CreatePokemon.
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
export function createPokemon(req, res, next) {
  accountService
    .createPokemon(req.body)
    .then((data) => res.status(HttpStatus.CREATED).json({ data }))
    .catch((err) => next(err));
}

/**
 * CreatePokemons.
 *
 * @param {*} req
 */
export async function createPokemons(req, res, next) {
  const pokemons = req.body;
  const result = [];
  for (const pokemon of pokemons) {
    const response = await accountService.createPokemon(pokemon);
    result.push(response);
  }

  res.json(result);
}

/**
 * QueryPokemons.
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
export function queryPokemons(req, res, next) {
  accountService
    .queryPokemons(req.query)
    .then((data) => res.status(HttpStatus.CREATED).json({ data }))
    .catch((err) => next(err));
}

/**
 * UpdatePokemon.
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
export function updatePokemon(req, res, next) {
  accountService
    .updatePokemon(req.params.id, req.body)
    .then((data) => res.status(HttpStatus.CREATED).json({ data }))
    .catch((err) => next(err));
}

/**
 * QueryInventories.
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
export function queryInventories(req, res, next) {
  accountService
    .queryInventories(req.query)
    .then((data) => res.status(HttpStatus.CREATED).json({ data }))
    .catch((err) => next(err));
}

/**
 * QuerySoldRecords.
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
export function querySoldRecords(req, res, next) {
  accountService
    .querySoldRecords(req.body)
    .then((data) => res.status(HttpStatus.CREATED).json({ data }))
    .catch((err) => next(err));
}

/**
 * CreateSoldRecord.
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
export function createSoldRecord(req, res, next) {
  accountService
    .createSoldRecord(req.body)
    .then((data) => res.status(HttpStatus.CREATED).json({ data }))
    .catch((err) => next(err));
}

/**
 * DeletePurchaseRecords.
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
export function deletePurchaseRecords(req, res, next) {
  accountService
    .deletePurchaseRecords(req.body)
    .then((data) => res.status(HttpStatus.CREATED).json({ data }))
    .catch((err) => next(err));
}

/**
 * DeleteSoldRecords.
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
export function deleteSoldRecords(req, res, next) {
  accountService
    .deleteSoldRecords(req.body)
    .then((data) => res.status(HttpStatus.CREATED).json({ data }))
    .catch((err) => next(err));
}

export function updateSettlementRecords(req, res, next) {
  accountService
    .updateSettlementRecords(req.body)
    .then((data) => res.status(HttpStatus.CREATED).json({ data }))
    .catch((err) => next(err));
}

export function queryRecordTotalByUnsettlement(req, res, next) {
  accountService
    .queryRecordTotalByUnsettlement(req.body)
    .then((data) => res.status(HttpStatus.CREATED).json({ data }))
    .catch((err) => next(err));
}

export function querySettlements(req, res, next) {
  accountService
    .querySettlements()
    .then((data) => res.status(HttpStatus.CREATED).json({ data }))
    .catch((err) => next(err));
}

export async function getSettlementDetail(req, res, next) {
  let result = {
    unsplitSolds: [],
    unsplitPurchases: [],
    detail: []
  };

  switch (req.query.status) {
    case 'unsettlement':
      result.detail = await accountService.getUnsettlementDetail(req.query);
      break;
    case 'settlemented':
      result.detail = await accountService.getSettlementDetail(req.query);
      break;
    default:
      break;
  }

  result.unsplitSolds = await accountService.getUnsplitSoldsByDate(req.query);
  result.unsplitPurchases = await accountService.getUnsplitPurchasesByDate(req.query);

  return res.status(HttpStatus.CREATED).json(result);
}

export async function updateSoldRecordsByDate(req, res, next) {
  accountService
    .updateSoldRecordsByDate(req.body)
    .then((data) => res.status(HttpStatus.CREATED).json({ data }))
    .catch((err) => next(err));
}

export async function updateSoldRecordsById(req, res, next) {
  accountService
    .updateSoldRecordsById(req.params.id, req.body)
    .then((data) => res.status(HttpStatus.CREATED).json({ data }))
    .catch((err) => next(err));
}

export async function updatePurchaseRecordsByDate(req, res, next) {
  accountService
    .updatePurchaseRecordsByDate(req.body)
    .then((data) => res.status(HttpStatus.CREATED).json({ data }))
    .catch((err) => next(err));
}

export async function updatePurchaseRecordsById(req, res, next) {
  accountService
    .updatePurchaseRecordsById(req.params.id, req.body)
    .then((data) => res.status(HttpStatus.CREATED).json({ data }))
    .catch((err) => next(err));
}
