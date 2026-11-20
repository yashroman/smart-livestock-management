import { Router } from 'express';
import { getFinanceSummary } from '../controllers/finance.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/summary', getFinanceSummary);

export default router;
