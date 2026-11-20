import { Router } from 'express';
import {
  getIncomeRecords,
  getIncomeSummary,
  getIncomeById,
  createIncome,
  updateIncome,
  deleteIncome,
} from '../controllers/finance.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/summary', getIncomeSummary);
router.get('/', getIncomeRecords);
router.get('/:id', getIncomeById);
router.post('/', createIncome);
router.put('/:id', updateIncome);
router.delete('/:id', deleteIncome);

export default router;
