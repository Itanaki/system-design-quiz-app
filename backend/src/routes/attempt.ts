import { Router } from 'express';
import * as ctrl from '../controllers/attempts.controller';
import { optionalAuth, requireAuth } from '../middleware/auth';

const router = Router();

router.post('/', optionalAuth, ctrl.postAttempt);
router.get('/', requireAuth, ctrl.getAttemptHistory);
router.get('/:id', requireAuth, ctrl.getAttemptDetails);

export default router;