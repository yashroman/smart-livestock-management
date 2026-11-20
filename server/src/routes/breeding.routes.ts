import { Router } from 'express';
import {
  getBreedingRecords,
  getBreedingRecordById,
  createBreedingRecord,
  updateBreedingRecord,
  deleteBreedingRecord,
} from '../controllers/breeding.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getBreedingRecords);
router.get('/:id', getBreedingRecordById);
router.post('/', createBreedingRecord);
router.put('/:id', updateBreedingRecord);
router.delete('/:id', deleteBreedingRecord);

export default router;
