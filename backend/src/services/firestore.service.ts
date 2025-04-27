import {getFirestore, Timestamp, FieldValue} from 'firebase-admin/firestore';
import {ActivityRecord, ActivityInput} from '../types/activity.types';



export async function addActivitytoDB(userId: string, activityData: ActivityInput, co2e: number): Promise<string> {
    const db = getFirestore();

    // Firestore genererer id når vi kaller add()
    const recordToSave: Omit<ActivityRecord, 'id'> = {
        ...activityData,
        userId,
        co2e,
        timestamp: FieldValue.serverTimestamp() as Timestamp
    };

    try {
        const userActivitiesRef = db.collection('users').doc(userId).collection('activities');
        const docRef = await userActivitiesRef.add(recordToSave)
        console.log(`Activity logged with ID: ${docRef.id} for user ${userId}`);
        return docRef.id
    } catch (error) {
        console.error(`Error adding activity to Firestore for user ${userId}`)
        throw new Error("Failed to save activity to Firestore.")
    }
}

export async function getActivitiesFromDB(userId: string, limit: number): Promise<ActivityRecord[]> {
    const db = getFirestore();

    try {
        const userActivitiesRef = db.collection('users').doc(userId).collection('activities');
        const snapshot = await userActivitiesRef.orderBy('timestamp', 'desc').limit(limit).get();

        if (snapshot.empty) {
            console.log('Empty list, no documents found.')
            return [];
        }

        const activities: ActivityRecord[] = [];
        snapshot.forEach(doc => {
            activities.push({id: doc.id, ...doc.data()} as ActivityRecord);
        });

        return activities
        
    } catch (error: any) {
        console.error(`Error getting activities from Firestore for ${userId}`, error);
        throw new Error('Failed to get activities from Firestore');
    }
}

export async function getActivityByIdFromDB(userId: string, activityId: string): Promise<ActivityRecord | null> {
    const db = getFirestore();

    try {
        const docRef = db.collection('users').doc(userId).collection('activities').doc(activityId);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
            return { id: docSnap.id, ...docSnap.data() } as ActivityRecord;
        } else {
            console.log(`Activity with ID ${activityId} not found for user ${userId}.`);
            return null;
        }
    } catch (error: any) {
        console.error(`Error getting activity ${activityId} from Firestore for user ${userId}:`, error);
        throw new Error('Failed to get activity from Firestore');
    }
}



