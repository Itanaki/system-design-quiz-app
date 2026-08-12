import { Router } from 'express';
import * as ctrl from '../controllers/attempts.controller';

const router = Router();

router.post('/', ctrl.postAttempt);

export default router;