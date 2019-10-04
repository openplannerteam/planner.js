import { inject, injectable } from "inversify";
import ReachableStopsFinderMode from "../../enums/ReachableStopsFinderMode";
import IStop from "../../fetcher/stops/IStop";
import IStopsProvider from "../../fetcher/stops/IStopsProvider";
import ILocation from "../../interfaces/ILocation";
import { DurationMs, SpeedKmH } from "../../interfaces/units";
import TYPES from "../../types";
import Geo from "../../util/Geo";
import IRoadPlanner from "../road/IRoadPlanner";
import IReachableStopsFinder, { IReachableStop } from "./IReachableStopsFinder";
import ReachableStopsFinderRoadPlanner from "./ReachableStopsFinderRoadPlanner";

/**
 * This [[IReachableStopsFinder]] forms a caching layer in front of a [[ReachableStopsFinderRoadPlanner]] instance,
 * so all the queries don't have to be executed repeatedly
 */
@injectable()
export default class ReachableStopsFinderRoadPlannerCached implements IReachableStopsFinder {
  private readonly reachableStopsFinder: ReachableStopsFinderRoadPlanner;
  private readonly reachableStopsCache: {[cacheKey: string]: IReachableStop[]};

  constructor(
    @inject(TYPES.StopsProvider) stopsProvider: IStopsProvider,
    @inject(TYPES.RoadPlanner) roadPlanner: IRoadPlanner,
  ) {
    this.reachableStopsFinder = new ReachableStopsFinderRoadPlanner(stopsProvider, roadPlanner);
    this.reachableStopsCache = {};
  }

  public async findReachableStops(
    location: ILocation,
    mode: ReachableStopsFinderMode,
    maximumDuration: DurationMs,
    minimumSpeed: SpeedKmH,
    profileID: string,
  ): Promise<IReachableStop[]> {

    const id = location.id || Geo.getId(location);
    const cacheKey = `${id} ${mode} ${maximumDuration} ${minimumSpeed}`;
    const cacheItem = this.reachableStopsCache[cacheKey];

    if (cacheItem) {
      return cacheItem;
    }

    const reachableStops = await this.reachableStopsFinder
      .findReachableStops(location, mode, maximumDuration, minimumSpeed, profileID);

    this.reachableStopsCache[cacheKey] = reachableStops;
    return reachableStops;
  }
}
