import haversine from "haversine";
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
  public static getDistanceBetweenLocations(start: ILocation, stop: ILocation): DistanceM {
    const { longitude: depLongitude, latitude: depLatitude } = start;
    const { longitude: arrLongitude, latitude: arrLatitude } = stop;

    if (depLongitude === undefined || depLatitude === undefined ||
      arrLongitude === undefined || arrLatitude === undefined) {
      return Number.POSITIVE_INFINITY;
    }

    return haversine({
      latitude: depLatitude,
      longitude: depLongitude,
    }, {
      latitude: arrLatitude,
      longitude: arrLongitude,
    }, {
      unit: "meter",
    });
  }

  /**
   * Calculate tge distance between two [[IStop]] instances using the haversine formula
   * @returns distance is meters ([[DistanceM]])
   */
  public static getDistanceBetweenStops(start: IStop, stop: IStop) {
    return this.getDistanceBetweenLocations(start as ILocation, stop as ILocation);
  }

  /**
   * Get the geo id of an [[ILocation]]
   * @param location
   * @returns geo id string
   */
  public static getId(location: ILocation): string {
    if ("id" in location) {
      return location.id;
    }

    return `geo:${location.latitude},${location.longitude}`;
  }
}
