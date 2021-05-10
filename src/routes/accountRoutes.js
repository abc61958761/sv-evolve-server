import { Router } from 'express';

import * as accountController from '../controllers/accounts';

const router = Router();

router.get('/purchaseRecords', accountController.queryPurchaseRecords);
router.delete('/purchaseRecords', accountController.deletePurchaseRecords);
router.post('/purchaseRecord', accountController.createPurchaseRecord);
router.patch('/purchaseRecords/splits', accountController.updatePurchaseRecordsByDate);
router.patch('/purchaseRecords/splits/:id', accountController.updatePurchaseRecordsById);
router.post('/pokemon', accountController.createPokemon);
router.post('/pokemon/:id', accountController.updatePokemon);
router.get('/pokemons', accountController.queryPokemons);
router.get('/inventories', accountController.queryInventories);
router.get('/soldRecords', accountController.querySoldRecords);
router.post('/soldRecord', accountController.createSoldRecord);
router.patch('/soldRecords/splits', accountController.updateSoldRecordsByDate);
router.patch('/soldRecords/splits/:id', accountController.updateSoldRecordsById);
router.delete('/soldRecords', accountController.deleteSoldRecords);
router.patch('/settlementRecords', accountController.updateSettlementRecords);
router.get('/settlements/unsettlement', accountController.queryRecordTotalByUnsettlement);
router.get('/settlements', accountController.querySettlements);
router.get('/settlements/detail', accountController.getSettlementDetail);

export default router;
