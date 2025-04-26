import 'dotenv/config';
import axios from 'axios';
import {ActivityInput} from '../types/activity.types';
import { ClimatiqSelector, ClimatiqParameters, ClimatiqEstimateResponse, ClimatiqEstimateInput } from '../types/climatiq.types';

const NORWAY_EV_KWH_PER_KM = 0.2; //elbilforeningen/sintef

function mapActivityToClimatiq(activityData: ActivityInput): ClimatiqEstimateInput | null {
    const { type, value, unit, region = 'NO'} = activityData;
    let selector: Omit<ClimatiqSelector, 'data_version'> | null = null;
    let parameters: ClimatiqParameters | null = null;
    
    switch (type) {
        // Transport
        case 'car_petrol_km':
            if (unit === 'km') {
                // UK BEIS
                selector = {activity_id: 'passenger_vehicle-vehicle_type_car-fuel_source_petrol-engine_size_na-vehicle_age_na-vehicle_weight_na'};
                parameters = {distance: value, distance_unit: 'km'};
            }
            break;
        case 'car_diesel_km':
            if (unit === 'km') {
                // UK BEIS 
                selector = {activity_id: 'passenger_vehicle-vehicle_type_car-fuel_source_diesel-engine_size_na-vehicle_age_na-vehicle_weight_na'};
                parameters = {distance: value, distance_unit: 'km'};
            }
            break;
        case 'car_electric_km':
            if (unit === 'km') {
                // Regner distanse (km) til energiforbuk (kWh) før beregning
                const totalenergyKwh = value * NORWAY_EV_KWH_PER_KM;
                selector = {
                     activity_id: 'electricity-energy_source_grid_mix',
                     region: region
                    };
                parameters = {energy: totalenergyKwh, energy_unit: 'kWh'};
            }
            break;
        case 'bus_local_km':
            if (unit === 'km') {
                 // UK BEIS 
                selector = {activity_id: 'passenger_vehicle-vehicle_type_local_bus-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na'};
                parameters = {distance: value, distance_unit: 'km'};
            }
            break;
        case 'train_national_km':
            if (unit === 'km') {
                // UK BEIS
                selector = {activity_id: 'passenger_train-route_type_national_rail-fuel_source_na'};
                parameters = {distance: value, distance_unit: 'km'};
            }
            break;
        case 'flight_domestic_km':
            if (unit === 'km') {
                // UK BEIS
                selector = {activity_id: 'passenger_flight-route_type_domestic-aircraft_type_na-class_economy'};
                // 1 passasjer som standard
                parameters = {passengers: 1, distance: value, distance_unit: 'km'};
            }
            break;

        // Energi
        case 'electricity_kwh':
            if (unit === 'kWh') {
                // NO EXIOBASE
                selector = {activity_id: 'electricity-energy_source_grid_mix', region: region};
                parameters = { energy: value, energy_unit: 'kWh' };
            }
            break;
        
        // varming hardkodet

        // --- Mat ---
        case 'food_beef_kg':
            if (unit === 'kg') {
                // Global EXIOBASE
                selector = { activity_id: 'food_beverage-type_beef_meat', source: 'EXIOBASE'};
                parameters = { weight: value, weight_unit: 'kg' };
            }
            break;
        case 'food_chicken_kg':
            if (unit === 'kg') {
                // Global EXIOBASE
                selector = { activity_id: 'food_beverage-type_poultry_meat', source: 'EXIOBASE', region: region };
                parameters = { weight: value, weight_unit: 'kg' };
            }
            break;

            //melk hardkodet

        default:
            console.log(`Failed to map activity: ${type}`)
            return null;
    }


    if (selector && parameters) {
        return { selector, parameters};
    } else {
        return null;
    }

}


const CLIMATIQ_API_KEY = process.env.CLIMATIQ_API_KEY;
const CLIMATIQ_API_URL = 'https://api.climatiq.io/data/v1/estimate';
const CLIMATIQ_DATA_VERSION = '^21'

async function estimateRaw(selector: Omit<ClimatiqSelector, 'data_version'>, parameters: ClimatiqParameters): Promise<number | null> {
    const payload = {
        emission_factor: {...selector, data_version: CLIMATIQ_DATA_VERSION},
        parameters: parameters
    };

    try {
        const response = await axios.post<ClimatiqEstimateResponse>(
            CLIMATIQ_API_URL, 
            payload, 
            {headers: {
                'Authorization': `Bearer ${CLIMATIQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000
            });
            console.log(`Received response from Climatiq: ${response.data}`);
            return response.data.co2e;
    } catch (error) {
        console.error(`Climatiq API request failed: ${error}`);
        return null;
    }
}


const NORWAY_HEATING_CO2E_PER_KWH = 0.175; // Miljødirektoratet
const NORWAY_MILK_CO2E_PER_KG = 1.2; // Melk LCA
const LITER_MILK_TO_KG = 1.03;

export async function getCo2eForActivity(activityData: ActivityInput): Promise<number | null> {
    const {type, value, unit} = activityData;
    let calculatedCo2e: number | null = null;

    switch (type) {
        case 'district_heating_kwh':
            if (unit === 'kWh') {
                calculatedCo2e = value * NORWAY_HEATING_CO2E_PER_KWH;
                return calculatedCo2e; 
            } else {
                console.log(`Invalid unit "${unit}" for direct calculation of district heating.`);
                return null;
            }

        case 'food_milk_kg':
            if (unit === 'kg') {
                calculatedCo2e = value * NORWAY_MILK_CO2E_PER_KG;
                return calculatedCo2e;
            } else {
                 console.log(`Invalid unit "${unit}" for direct calculation of milk by mass.`);
                 return null;
            }

        case 'food_milk_l':
            if (unit === 'L') {
                const kgValue = value * LITER_MILK_TO_KG; // Konverter liter til kg
                calculatedCo2e = kgValue * NORWAY_MILK_CO2E_PER_KG;
                return calculatedCo2e;
            } else {
                 console.log(`Invalid unit "${unit}" for direct calculation of milk by volume.`);
                 return null;
            }
    }

    const climatiqInput = mapActivityToClimatiq(activityData);

    if (!climatiqInput) {
        console.log(`Could not map activity ${type} to Climatiq parameters.`)
        return null;
    }

    const co2eFromApi = await estimateRaw(climatiqInput.selector, climatiqInput.parameters);
    return co2eFromApi; 
}








