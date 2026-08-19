import { Router } from 'express';
import * as ctrl from '../controllers/quizzes.controller';
import { requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/sections', ctrl.getSectionsController);
router.get('/session', ctrl.getSessionQuestionsController);

// public endpoint. Response must omit correct answer and explanation fields
router.get('/questions/:id', ctrl.getQuestionController);

// admin-only endpoints
router.get('/questions', requireAdmin, ctrl.listQuestionsController);
router.post('/questions', requireAdmin, ctrl.createQuestionController);
router.patch(
'/questions/:id', 
requireAdmin, 
ctrl.updateQuestionController
);
router.delete(
  '/questions/:id',
  requireAdmin,
  ctrl.deleteQuestionController
);


export default router;