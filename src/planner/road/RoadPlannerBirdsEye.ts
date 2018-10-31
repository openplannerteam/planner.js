import haversine from "haversine";
import { inject, injectable } from "inversify";
import IStop from "../../fetcher/stops/IStop";
import IStopsFetcher from "../../fetcher/stops/IStopsFetcher";
import ILocation from "../../interfaces/ILocation";
import IPath from "../../interfaces/IPath";
import IResolvedQuery from "../../query-runner/IResolvedQuery";
import TYPES from "../../types";
import IRoadPlanner from "./IRoadPlanner";

@injectable()
export default class RoadPlannerBirdsEye implements IRoadPlanner {
  private stopsFetcher: IStopsFetcher;

  constructor(@inject(TYPES.StopsFetcher) stopsFetcher: IStopsFetcher) {
    this.stopsFetcher = stopsFetcher;
  }

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
    const path = {
      distance: Number.POSITIVE_INFINITY,
      points: [{ location: from }, { location: to }],
    };

    const fromStop = await this.stopsFetcher.getStopById(from.id);
    const toStop = await this.stopsFetcher.getStopById(to.id);

    if (fromStop && toStop) {
      path.distance = this.getDistanceBetweenStops(fromStop, toStop);
    }
    return path;
  }

  private getDistanceBetweenStops(departureStop: IStop, arrivalStop: IStop): number {
    const { longitude: depLongitude, latitude: depLatitude } = departureStop;
    const { longitude: arrLongitude, latitude: arrLatitude } = arrivalStop;

    return haversine({
      latitude: depLatitude,
      longitude: depLongitude,
    }, {
      latitude: arrLatitude,
      longitude: arrLongitude,
    });
  }
}
