import { Router } from 'express';
import * as ctrl from '../controllers/attempts.controller.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';

const router = Router();    

router.post('/', optionalAuth, ctrl.postAttempt);
router.get('/incomplete', optionalAuth, ctrl.getIncompleteAttempt);  
router.patch('/:id/abandon', optionalAuth, ctrl.abandonAttemptController);  
router.get('/', requireAuth, ctrl.getAttemptHistory);
router.get('/:id', requireAuth, ctrl.getAttemptDetails);

export default router;