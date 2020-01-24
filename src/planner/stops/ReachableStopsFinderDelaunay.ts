import { AsyncIterator } from "asynciterator";
import { Delaunay } from "d3-delaunay";
import { inject, injectable } from "inversify";
import ReachableStopsFinderMode from "../../enums/ReachableStopsFinderMode";
import IStop from "../../fetcher/stops/IStop";
import IStopsProvider from "../../fetcher/stops/IStopsProvider";
import ILocation from "../../interfaces/ILocation";
import IPath from "../../interfaces/IPath";
import { DurationMs, SpeedKmH } from "../../interfaces/units";
import IResolvedQuery from "../../query-runner/IResolvedQuery";
import TYPES from "../../types";
import Geo from "../../util/Geo";
import Iterators from "../../util/Iterators";
import IRoadPlanner from "../road/IRoadPlanner";
import IReachableStopsFinder, { IReachableStop } from "./IReachableStopsFinder";

@injectable()
export default class ReachableStopsFinderDelaunay implements IReachableStopsFinder {
  private readonly stopsProvider: IStopsProvider;
  private readonly roadPlanner: IRoadPlanner;
  private triangles: Delaunay;
  private trianglePoints: IStop[];

  constructor(
    @inject(TYPES.StopsProvider) stopsProvider: IStopsProvider,
    @inject(TYPES.RoadPlanner) roadPlanner: IRoadPlanner,
  ) {
    this.stopsProvider = stopsProvider;
    this.roadPlanner = roadPlanner;
    this.prepare();
  }

  public async findReachableStops(
    location: ILocation,
    mode: ReachableStopsFinderMode,
    maximumDuration: DurationMs,
    minimumSpeed: SpeedKmH,
    profileID: string,
  ): Promise<IReachableStop[]> {

    const minimumDepartureTime = new Date();
    const maximumArrivalTime = new Date(minimumDepartureTime.getTime() + maximumDuration);

    const baseProp = mode === ReachableStopsFinderMode.Target ? "to" : "from";
    const otherProp = mode === ReachableStopsFinderMode.Target ? "from" : "to";

    const baseQuery: IResolvedQuery = {
      [baseProp]: [location],
      minimumDepartureTime,
      maximumArrivalTime,
      minimumWalkingSpeed: minimumSpeed,
      profileID,
    };

    const stopsNearCell: IStop[] = await this.getNearbyStops(location);
    const reachableStops: IReachableStop[] = [];

    await Promise.all(stopsNearCell.map(async (possibleTarget: IStop) => {
      const query = Object.assign({}, baseQuery, {
        [otherProp]: [possibleTarget as ILocation],
      });

      const pathIterator = await this.roadPlanner.plan(query);

      const durationIterator: AsyncIterator<DurationMs> = pathIterator.map((path: IPath) =>
        path.legs.reduce((totalDuration: DurationMs, step) => totalDuration + step.getAverageDuration(), 0),
      );

      const durations = await Iterators.toArray(durationIterator);
      if (durations.length) {
        const shortestDuration = Math.min(...durations);
        reachableStops.push({ stop: possibleTarget, duration: shortestDuration });
      }
    }));

    return reachableStops;
  }

  private async getNearbyStops(location: ILocation): Promise<IStop[]> {
    if (!this.triangles) {
      await this.prepare();
    }

    const cell = this.triangles.find(location.longitude, location.latitude);

    const result = [this.trianglePoints[cell]];

    // not including these for now
    // may result in large route network queries if the stops network is sparse

    /*
    const neighbors = this.triangles.neighbors(cell);
    for (const neighbor of neighbors) {
      const neighborLocation = this.trianglePoints[neighbor];
      if (Geo.getDistanceBetweenLocations(location, neighborLocation) < 2500) {
        result.push(neighborLocation);
      }
    }
    */
    return result;
  }

  private async prepare() {
    this.trianglePoints = await this.stopsProvider.getAllStops();

    if (this.trianglePoints && this.trianglePoints.length) {
      function getX(p: ILocation) {
        return p.longitude;
      }

      function getY(p: ILocation) {
        return p.latitude;
      }

      this.triangles = Delaunay.from(this.trianglePoints, getX, getY);
    }
  }
}
