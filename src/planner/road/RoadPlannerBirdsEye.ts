import haversine from "haversine";
import { inject, injectable } from "inversify";
import IStopsFetcher from "../../fetcher/stops/IStopsFetcher";
import IQuery from "../../query-runner/IQuery";
import TYPES from "../../types";
import IJourney from "../IJourney";
import IRoadPlanner from "./IRoadPlanner";

@injectable()
export default class RoadPlannerBirdsEye implements IRoadPlanner {
  private stopsFetcher: IStopsFetcher;

  constructor(@inject(TYPES.StopsFetcher) stopsFetcher: IStopsFetcher) {
    this.stopsFetcher = stopsFetcher;
  }

  public async plan(query: IQuery): Promise<IJourney[]> {
    const { from, to } = query;

    const fromStop = await this.stopsFetcher.getStopById(from);
    const toStop = await this.stopsFetcher.getStopById(to);

    if (fromStop && toStop) {
      const distance = this.getDistanceBetweenStops(fromStop, toStop);

      return [{ distance }];
    }

    return [{ distance: Number.POSITIVE_INFINITY }];
  }

  private getDistanceBetweenStops(departureStop, arrivalStop): number {
    const { locationX: depLongitude, locationY: depLatitude } = departureStop;
    const { locationX: arrLongitude, locationY: arrLatitude } = arrivalStop;

    return haversine({
      latitude: depLatitude,
      longitude: depLongitude,
    }, {
      latitude: arrLatitude,
      longitude: arrLongitude,
    });
  }
}
