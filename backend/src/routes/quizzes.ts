import { Router } from 'express';
import * as ctrl from '../controllers/quizzes.controller';

const router = Router();

router.get('/sections', ctrl.getSectionsController);
router.get('/session', ctrl.getSessionQuestionsController);
router.get('/questions/:id', ctrl.getQuestionController);
router.post('/questions', ctrl.createQuestionController); // admin

export default router;