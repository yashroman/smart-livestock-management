import { Router } from 'express';
import {
  getMilkRecords,
  getMilkSummary,
  getMilkRecordById,
  createMilkRecord,
  updateMilkRecord,
  deleteMilkRecord,
} from '../controllers/milk.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getMilkRecords);
router.get('/summary', getMilkSummary);
router.get('/:id', getMilkRecordById);
router.post('/', createMilkRecord);
router.put('/:id', updateMilkRecord);
router.delete('/:id', deleteMilkRecord);

export default router;
