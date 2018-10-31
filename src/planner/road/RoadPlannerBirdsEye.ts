import haversine from "haversine";
import { inject, injectable } from "inversify";
import ILocation from "../../interfaces/ILocation";
import IPath from "../../interfaces/IPath";
import IResolvedQuery from "../../query-runner/IResolvedQuery";
import IRoadPlanner from "./IRoadPlanner";

@injectable()
export default class RoadPlannerBirdsEye implements IRoadPlanner {

  public async plan(query: IResolvedQuery): Promise<IPath[]> {
    const { from: fromLocations, to: toLocations } = query;

    const paths = [];

    if (fromLocations && toLocations && fromLocations.length && toLocations.length) {

      for (const from of fromLocations) {
        for (const to of toLocations) {
          const path = await this.getPathBetweenLocations(from, to);

          paths.push(path);
        }
      }
    }

    return paths;
  }

  private async getPathBetweenLocations(from: ILocation, to: ILocation): Promise<IPath> {
    return {
      distance: this.getDistanceBetweenLocations(from, to),
      points: [{ location: from }, { location: to }],
    };
  }

  private getDistanceBetweenLocations(from: ILocation, to: ILocation): number {
    const { longitude: depLongitude, latitude: depLatitude } = from;
    const { longitude: arrLongitude, latitude: arrLatitude } = to;

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
