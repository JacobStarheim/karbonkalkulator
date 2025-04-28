import 'dotenv/config';
import axios from 'axios';
import {ActivityInput} from '../types/activity.types';
import { ClimatiqSelector, ClimatiqParameters, ClimatiqEstimateResponse, ClimatiqEstimateInput } from '../types/climatiq.types';


const NORWAY_EV_KWH_PER_KM = 0.2; // Elbilforeningen/Sintef

// Spar
const NOK_PER_KG_BEEF = 250;
const NOK_PER_KG_PORK = 150;
const NOK_PER_KG_POULTRY = 150;
const NOK_PER_KG_FISH = 225;
const NOK_PER_KG_DAIRY = 50;

function mapActivityToClimatiq(activityData: ActivityInput): ClimatiqEstimateInput | null {
    const { type, value, unit, region = 'NO'} = activityData;
    let selector: Omit<ClimatiqSelector, 'data_version'> | null = null;
    let parameters: ClimatiqParameters | null = null;
    
    switch (type) {
        // Transport
        case 'car_petrol_km':
            if (unit === 'km') {
                selector = {
                    activity_id: 'passenger_vehicle-vehicle_type_car-fuel_source_petrol-engine_size_na-vehicle_age_na-vehicle_weight_na',
                    source: 'BEIS',
                    region: 'GB'
                };
                parameters = {distance: value, distance_unit: 'km'};
            }
            break;

        case 'car_diesel_km':
            if (unit === 'km') {
                selector = {
                    activity_id: 'passenger_vehicle-vehicle_type_car-fuel_source_diesel-engine_size_na-vehicle_age_na-vehicle_weight_na',
                    source: 'BEIS',
                    region: 'GB'
                };
                parameters = {distance: value, distance_unit: 'km'};
            }
            break;

        case 'car_electric_km':
            if (unit === 'km') {
                // Regner distanse (km) til energiforbuk (kWh) før beregning
                const totalenergyKwh = value * NORWAY_EV_KWH_PER_KM;
                selector = {
                     activity_id: 'electricity-supply_grid-source_production_mix',
                     region: region
                    };
                parameters = {energy: totalenergyKwh, energy_unit: 'kWh'};
            }
            break;


        // Energi
        case 'electricity_kwh':
            if (unit === 'kWh') {
                selector = {
                    activity_id: 'electricity-supply_grid-source_production_mix',
                    region: region
                };
                parameters = { energy: value, energy_unit: 'kWh' };
            }
            break;
        

        // fjernvarming hardkodet



        // Mat
        case 'food_beef_kg':
            if (unit === 'kg') {
            selector = {
                activity_id: 'consumer_goods-type_meat_products_beef',
                source: 'EXIOBASE',
                region: 'NO'
            };
            parameters = {money: value * NOK_PER_KG_BEEF, money_unit: 'nok'};
            }
            break;

        case 'food_pork_kg':
            if (unit === 'kg') {
            selector = {
                activity_id: 'consumer_goods-type_meat_products_pork',
                source: 'EXIOBASE',
                region: 'NO'
            };
            parameters = {money: value * NOK_PER_KG_PORK, money_unit: 'nok'};
            }
            break;

        case 'food_poultry_kg':
            if (unit === 'kg') {
            selector = {
                activity_id: 'consumer_goods-type_meat_products_poultry',
                source: 'EXIOBASE',
                region: 'NO'
            };
            parameters = {money: value * NOK_PER_KG_POULTRY, money_unit: 'nok'};
            }
            break;

        case 'food_fish_kg':
            if (unit === 'kg') {
            selector = {
                activity_id: 'consumer_goods-type_fish_products',
                source: 'EXIOBASE',
                region: 'NO'
            };
            parameters = {money: value * NOK_PER_KG_FISH, money_unit: 'nok'};
            }
            break;

        case 'food_dairy_kg':
            if (unit === 'kg') {
            selector = {
                activity_id: 'consumer_goods-type_dairy_products',
                source: 'EXIOBASE',
                region: 'NO'
            };
            parameters = {money: value * NOK_PER_KG_DAIRY, money_unit: 'nok'};
            }
            break;


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
        if (axios.isAxiosError(error)) {
            console.error('Climatiq API response data:', JSON.stringify(error.response?.data, null, 2));
            console.error('Climatiq API response data:', error.response?.data);
            if (!error.response) {
                console.error('Climatiq API request error (no response):', error.message);
            }
        } else {
            console.error('An unexpected error occurred in estimateRaw:', error);
        }
        return null;
    }
}


const NORWAY_HEATING_CO2E_PER_KWH = 0.175; // Miljødirektoratet
const NORWAY_BUS_CO2E_PER_KM             = 0.059;  // SSB
const NORWAY_TRAIN_CO2E_PER_KM           = 0.0058; // SSB
const NORWAY_DOMESTIC_FLIGHT_CO2E_PER_KM = 0.181;  // SSB

export async function getCo2eForActivity(activityData: ActivityInput): Promise<number | null> {
    const {type, value, unit} = activityData;
    let calculatedCo2e: number | null = null;

    switch (type) {
        case 'district_heating_kwh':
            if (unit !== 'kWh') {
                console.error(`Invalid unit for district_heating_kwh: ${unit}`);
                return null;
            }
            calculatedCo2e = value * NORWAY_HEATING_CO2E_PER_KWH;
            break;

        case 'bus_local_km':
            if (unit !== 'km') {
                console.error(`Invalid unit for bus_local_km: ${unit}`);
                return null;
            }
            calculatedCo2e = value * NORWAY_BUS_CO2E_PER_KM;
            break;

        case 'train_national_km':
            if (unit !== 'km') {
                console.error(`Invalid unit for train_national_km: ${unit}`);
                return null;
            }
            calculatedCo2e = value * NORWAY_TRAIN_CO2E_PER_KM;
            break;

        case 'flight_domestic_km':
            if (unit !== 'km') {
                console.error(`Invalid unit for flight_domestic_km: ${unit}`);
                return null;
            }
            calculatedCo2e = value * NORWAY_DOMESTIC_FLIGHT_CO2E_PER_KM;
            break;
    }


    if (calculatedCo2e !== null) {
        return calculatedCo2e;
    }

    
    const climatiqInput = mapActivityToClimatiq(activityData);
    if (!climatiqInput) {
        console.log(`Could not map activity ${type} to Climatiq parameters.`)
        return null;
    }

    const co2eFromApi = await estimateRaw(climatiqInput.selector, climatiqInput.parameters);
    return co2eFromApi; 
}








