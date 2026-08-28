import { Router } from 'express';
import * as ctrl from '../controllers/leaderboard.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/global', requireAuth, ctrl.getGlobalLeaderboardController);
router.get('/difficulty/:level', requireAuth, ctrl.getDifficultyLeaderboardController);
router.get('/me', requireAuth, ctrl.getMyRankController);

export default router;