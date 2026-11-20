import { Router } from 'express';
import {
  getReminders,
  getUpcomingReminders,
  getOverdueReminders,
  getReminderById,
  createReminder,
  updateReminder,
  completeReminder,
  deleteReminder,
} from '../controllers/reminder.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/upcoming', getUpcomingReminders);
router.get('/overdue', getOverdueReminders);
router.patch('/:id/complete', completeReminder);
router.get('/', getReminders);
router.get('/:id', getReminderById);
router.post('/', createReminder);
router.put('/:id', updateReminder);
router.delete('/:id', deleteReminder);

export default router;
