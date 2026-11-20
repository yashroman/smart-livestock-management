import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  chatHandler,
  getConversationsHandler,
  getConversationByIdHandler,
  createConversationHandler,
  deleteConversationHandler,
} from '../controllers/ai.controller';

const router = Router();

// Protect all AI assistant routes with JWT authentication
router.use(authenticateToken);

router.post('/chat', chatHandler);
router.get('/conversations', getConversationsHandler);
router.get('/conversations/:id', getConversationByIdHandler);
router.post('/conversations', createConversationHandler);
router.delete('/conversations/:id', deleteConversationHandler);

export default router;
