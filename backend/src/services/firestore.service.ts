import {getFirestore, Timestamp, FieldValue} from 'firebase-admin/firestore';
import {ActivityRecord, ActivityInput} from '../types/activity.types';

const db = getFirestore();

export async function addActivitytoDB(userId: string, activityData: ActivityInput, co2e: number): Promise<string> {
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

//TODO: legge inn flere firestore services her



