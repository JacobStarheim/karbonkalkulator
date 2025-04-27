import {Request, Response} from 'express';
import {getCo2eForActivity} from '../services/climatiq.service';
import {addActivitytoDB, getActivitiesFromDB, getActivityByIdFromDB} from '../services/firestore.service';
import {ActivityInput} from '../types/activity.types';

export async function logActivity(req: Request, res: Response): Promise<void> {

    // allerede sjekket i auth.middleware
    const userId = req.user!.uid;

    const activityInput: ActivityInput = req.body;
    if (!activityInput || typeof activityInput !== 'object') {
        res.status(400).send({error: 'Bad request', message: 'Missing request body'});
        return;
    }

    const {type, value, unit} = activityInput
    if (typeof type !== 'string' || typeof value !== 'number' || typeof unit !== 'string') {
        res.status(400).send({error: 'Bad request', message: 'Invalid activity data'});
        return;
    }

    try {
        const co2e = await getCo2eForActivity(activityInput);

        if (co2e === null) {
            console.log(`Failed to  to calculate CO2e for user: ${userId}`);
            res.status(500).send({error: 'Calculation failed', message: 'Failed to calculate CO2e'});
            return;
        }

        const newActivityId = await addActivitytoDB(userId, activityInput, co2e);
        res.status(201).send({message: 'Logged activity', activityId: newActivityId, calculatedCo2e: co2e});

    } catch (error: any) {
        console.error(`Error in logActivity controller for user: ${userId}`, error);
        res.status(500).send({error: 'Internal server error', message: 'Failed to log activity'});
    }
}


export async function getAllActivities(req: Request, res: Response): Promise<void> {
    const userId = req.user!.uid;

    const limitQuery = req.query.limit as string | undefined;
    let limit = 50;
    if (limitQuery) {
        const parsedLimit = parseInt(limitQuery, 10);
        if (parsedLimit > 0) {
            limit = parsedLimit;
        }
    }

    try {
        const activities = await getActivitiesFromDB(userId, limit);
        res.status(200).json(activities);
    } catch (error: any) {
        console.error(`Error in getAllActivities controller for user: ${userId}`, error);
        res.status(500).send({ error: 'Internal Server Error', message: 'Failed to get activities.' });
    }
}

export async function getActivityById(req: Request, res: Response): Promise<void> {
    const userId = req.user!.uid;
    const activityId = req.params.activityId;

    if (!activityId) {
        res.status(400).send({error: 'Bad request', message: 'Acitvity ID missing in URl'});
        return;
    }
    
    try {
        const activity = await getActivityByIdFromDB(userId, activityId);
        if (activity) {
            res.status(200).json(activity);
        } else {
            res.status(404).send({error: 'Not found', message: 'Activity not found.'});
        }
        
    } catch (error: any) {
        console.error(`Error in getActivityById controller for user ${userId}, activity ${activityId}:`, error);
        res.status(500).send({ error: 'Internal Server Error', message: 'Failed to get activity.' });
    }
}









