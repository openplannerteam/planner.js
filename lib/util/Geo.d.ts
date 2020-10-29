import IStop from "../fetcher/stops/IStop";
import ILocation from "../interfaces/ILocation";
import { DistanceM } from "../interfaces/units";
/**
 * Utility class with geographic functions
 */
export default class Geo {
    /**
     * Calculate the distance between two [[ILocation]] instances using the haversine formula
     * @returns distance is meters ([[DistanceM]])
     */
    static getDistanceBetweenLocations(start: ILocation, stop: ILocation): DistanceM;
    /**
     * Calculate tge distance between two [[IStop]] instances using the haversine formula
     * @returns distance is meters ([[DistanceM]])
     */
    static getDistanceBetweenStops(start: IStop, stop: IStop): number;
    /**
     * Get the geo id of an [[ILocation]]
     * @param location
     * @returns geo id string
     */
    static getId(location: ILocation): string;
}
