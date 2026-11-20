import { Router } from 'express';
import { exportModuleCsv } from '../controllers/report.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/:module/csv', exportModuleCsv);
router.get('/export/:module', exportModuleCsv);

export default router;
