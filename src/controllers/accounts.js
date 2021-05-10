import HttpStatus from 'http-status-codes';

import * as accountService from '../services/accountService';

/**
 * QueryPurchaseRecords.
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
export function queryPurchaseRecords(req, res, next) {
  accountService
    .queryPurchaseRecords()
    .then((data) => res.status(HttpStatus.CREATED).json({ data }))
    .catch((err) => next(err));
}

/**
 * CreatePurchaseRecord.
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
export function createPurchaseRecord(req, res, next) {
  accountService
    .createPurchaseRecord(req.body)
    .then((data) => res.status(HttpStatus.CREATED).json({ data }))
    .catch((err) => next(err));
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
    .queryInventories(req.body)
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
