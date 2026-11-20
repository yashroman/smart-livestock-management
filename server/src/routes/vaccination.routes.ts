import { Router } from 'express';
import {
  getVaccinations,
  getVaccinationById,
  createVaccination,
  updateVaccination,
  deleteVaccination,
} from '../controllers/vaccination.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getVaccinations);
router.get('/:id', getVaccinationById);
router.post('/', createVaccination);
router.put('/:id', updateVaccination);
router.delete('/:id', deleteVaccination);

export default router;
