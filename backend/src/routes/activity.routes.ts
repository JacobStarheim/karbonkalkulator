import express, {Router, Request, Response} from 'express';
import {authMiddleware} from '../middleware/auth.middleware';
import {getAllActivities, logActivity} from '../controllers/activity.controller';

const router: Router = express.Router();

router.get('/', getAllActivities);
router.post('/', logActivity);

export default router;





