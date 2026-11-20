import { Router } from 'express';
import {
  getLivestockList,
  getLivestockById,
  createLivestock,
  updateLivestock,
  deleteLivestock,
} from '../controllers/livestock.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Protect all livestock routes with JWT
router.use(authenticateToken);

router.get('/', getLivestockList);
router.get('/:id', getLivestockById);
router.post('/', createLivestock);
router.put('/:id', updateLivestock);
router.delete('/:id', deleteLivestock);

export default router;
