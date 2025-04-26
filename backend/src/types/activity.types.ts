import {Timestamp} from 'firebase-admin/firestore'

export interface ActivityInput {
    type: string; //aktivitetstype: car_petrol_km
    value: number;
    unit: string;
    region?: string;
    notes?: string; //bruker sin egne notater om aktiviteten
}

export interface ActivityRecord extends ActivityInput {
    id?: string; //firestore id, opprettes av firestore
    userId: string; // firebase auth uid
    timestamp: Timestamp; 
    co2e: number; 
}






