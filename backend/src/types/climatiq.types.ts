
export interface ClimatiqSelector {
    data_version: string // climatiq versjon 
    activity_id: string; //Data explorer ID
    source?:  string; //Database:  BEIS, EXIOBASE
    region?:  string;//Landkode: NO, GB, US 
    year?: number; //Årstall dataene kommer fra
}   

// dynamisk parameter: 
export interface ClimatiqParameters {
    [param: string]: number | string 
}

export interface ClimatiqEstimateResponse {
    co2e: number; //kg co2e
    co2e_unit: string; // alltid kg
    emission_factor: {
        activity_id: string;
        name?: string;
        region?: string;
        year?: number;
        source?: string;
    };
}

export interface ClimatiqEstimateInput {
    selector: Omit<ClimatiqSelector, 'data_version'>; //kommer fra estimateRaw()
    parameters: ClimatiqParameters;
}
