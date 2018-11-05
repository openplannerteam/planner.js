import haversine from "haversine";
import IStop from "../fetcher/stops/IStop";
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

  public static getDistanceBetweenStops(start: IStop, stop: IStop) {
    return this.getDistanceBetweenLocations(start as ILocation, stop as ILocation);
  }
}
