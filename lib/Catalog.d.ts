import TravelMode from "./enums/TravelMode";
export interface IStopsSourceConfig {
    accessUrl: string;
}
export interface IConnectionsSourceConfig {
    accessUrl: string;
    travelMode: TravelMode;
}
