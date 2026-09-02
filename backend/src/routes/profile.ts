import { Router } from 'express';
import * as ctrl from '../controllers/profile.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/badges', requireAuth, ctrl.getMyBadges);
router.put('/badges/showcase', requireAuth, ctrl.putShowcasedBadges);

export default router;