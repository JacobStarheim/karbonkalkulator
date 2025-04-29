import 'dotenv/config'
import cors from 'cors'
import express, {Application, Response, Request} from 'express';
import { initializeApp } from 'firebase-admin/app';

import activityRoutes from './routes/activity.routes';
import tipsRoutes from './routes/tips.routes';
import { authMiddleware } from './middleware/auth.middleware';


function startServer() {
    try {
        initializeApp();
        console.log('Firebase admin SDK initialized');

        const app: Application = express();
        const port: number = parseInt(process.env.PORT || '3001', 10);

        app.use(cors());
        app.use(express.json());

        app.get('/health', (req: Request, res: Response) => {
            res.status(200).send('OK');
        });

        app.use('/api/activities', authMiddleware, activityRoutes);
        app.use('/api/tips', tipsRoutes);

        app.listen(port, () => {
            console.log(`Backend server listening at http://localhost:${port}`)
        });

    } catch (error: any) {
        console.error('Failed to start server: ', error);
        process.exit(1);
    }
}

startServer();







