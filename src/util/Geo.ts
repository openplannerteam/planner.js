import haversine from "haversine";
import ILocation from "../interfaces/ILocation";

export default class Geo {
  public static getDistanceBetweenLocations(start: ILocation, stop: ILocation): number {
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
    });
  }
}
