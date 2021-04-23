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
