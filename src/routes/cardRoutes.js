import { Router } from 'express';

import * as cardController from '../controllers/cards';

const router = Router();

router.get('/', cardController.queryCards);
router.post('/', cardController.createCard);
router.post('/upload', cardController.uploadFile);
router.patch('/card', cardController.updateCard);

export default router;
