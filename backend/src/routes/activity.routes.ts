import express, {Router, Request, Response} from 'express';
import {getActivityById, getAllActivities, logActivity} from '../controllers/activity.controller';

const router: Router = express.Router();

router.get('/', getAllActivities);
router.post('/', logActivity);
router.get('/:activityId', getActivityById);

export default router;




