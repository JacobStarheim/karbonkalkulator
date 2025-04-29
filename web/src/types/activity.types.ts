import type { Timestamp } from 'firebase/firestore';

export interface ActivityInput {
    type: string;
    value: number;
    unit: string;
    region?: string;
    notes?: string;  
}

export interface ActivityRecord extends ActivityInput {
    id?: string;       
    userId: string;     
    timestamp: Timestamp; 
    co2e: number;
}