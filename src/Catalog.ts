import TravelMode from "./enums/TravelMode";

// bit of legacy stuff, should be ok
export interface IStopsSourceConfig {
  accessUrl: string;
}

export interface IConnectionsSourceConfig {
  accessUrl: string;
  travelMode: TravelMode;
}
