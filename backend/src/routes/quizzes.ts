import { Router } from 'express';
import * as ctrl from '../controllers/quizzes.controller';

const router = Router();

router.get('/sections', ctrl.getSections);
router.get('/questions/:id', ctrl.getQuestion);
router.post('/questions', ctrl.createQuestion); // admin

export default router;