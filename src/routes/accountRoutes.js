import { Router } from 'express';

import * as accountController from '../controllers/accounts';

const router = Router();

router.get('/purchaseRecords', accountController.queryPurchaseRecords);
router.delete('/purchaseRecords', accountController.deletePurchaseRecords);
router.post('/purchaseRecord', accountController.createPurchaseRecord);
router.post('/pokemon', accountController.createPokemon);
router.post('/pokemon/:id', accountController.updatePokemon);
router.get('/pokemons', accountController.queryPokemons);
router.get('/inventories', accountController.queryInventories);
router.get('/soldRecords', accountController.querySoldRecords);
router.post('/soldRecord', accountController.createSoldRecord);
router.delete('/soldRecords', accountController.deleteSoldRecords);

export default router;
