import { Router } from 'express';
import {
  getFeedRecords,
  getFeedSummary,
  getFeedRecordById,
  createFeedRecord,
  updateFeedRecord,
  deleteFeedRecord,
} from '../controllers/feed.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes are protected by JWT authentication
router.use(authenticate);

router.get('/summary', getFeedSummary);
router.get('/', getFeedRecords);
router.get('/:id', getFeedRecordById);
router.post('/', createFeedRecord);
router.put('/:id', updateFeedRecord);
router.delete('/:id', deleteFeedRecord);

export default router;
