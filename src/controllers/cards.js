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
  const result = []
  let temp = {
      "version": null,
      "code": null,
      "consumption": null,
      "describe": null,
      "level": null,
      "name": null,
      "profession": null,
      "type": null
  }

  for(const sheetName of wb.SheetNames) {
    console.log(sheetName)
    for (const [key, value] of Object.entries(wb.Sheets[sheetName])) {

      var col = key.substring(0,1);
      var row = parseInt(key.substring(1));
      if(row == 1) {
          headers[col] = value.v;
          continue;
      }

      temp[headers[col]] = value.v !== "null" ? value.v : null;
      if (col == "I" && temp.code) {
        console.log(temp)
        const response = await cardService.createCard(temp);
        // result.push(response)
        temp = {
            "version": null,
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

  res.json(result);
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