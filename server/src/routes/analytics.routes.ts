import { Router } from 'express';
import {
  getAnalyticsOverview,
  getLivestockAnalytics,
  getMilkAnalytics,
  getHealthAnalytics,
  getVaccinationAnalytics,
  getBreedingAnalytics,
  getFeedAnalytics,
  getFinanceAnalytics,
} from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All analytics endpoints require valid JWT authentication
router.use(authenticate);

router.get('/overview', getAnalyticsOverview);
router.get('/livestock', getLivestockAnalytics);
router.get('/milk', getMilkAnalytics);
router.get('/health', getHealthAnalytics);
router.get('/vaccinations', getVaccinationAnalytics);
router.get('/breeding', getBreedingAnalytics);
router.get('/feed', getFeedAnalytics);
router.get('/finance', getFinanceAnalytics);

export default router;
