import express, {Router, Request, Response} from 'express';
import {getTips} from '../controllers/tips.controller';

const router: Router = express.Router();
router.get('/', getTips);
export default router;

