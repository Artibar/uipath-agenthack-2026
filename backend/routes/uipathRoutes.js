import express from 'express';
import { triggerUiPath } from '../controllers/uipathController.js';

const router = express.Router();
router.post('/trigger/:caseId', triggerUiPath);
export default router;