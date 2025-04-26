import {Request, Response, NextFunction} from 'express';
import {getAuth, DecodedIdToken} from 'firebase-admin/auth';

declare global {
    namespace Express {
        interface Request {
            user?: DecodedIdToken;
        }
    }    
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).send({error: 'Unauthorized', message: 'Missing bearer token or invalid format.'});
        return;
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
        const decodedToken: DecodedIdToken = await getAuth().verifyIdToken(idToken);
        req.user = decodedToken;
        next();
    } catch (error: any) {
        console.error('authMiddleware error verifying token:', error);
        res.status(403).send({error: 'Forbidden', message: 'Invalid token'});
    }
}






















