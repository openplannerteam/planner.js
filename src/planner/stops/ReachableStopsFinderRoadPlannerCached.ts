import { inject, injectable } from "inversify";
import ReachableStopsFinderMode from "../../enums/ReachableStopsFinderMode";
import IStop from "../../fetcher/stops/IStop";
import IStopsProvider from "../../fetcher/stops/IStopsProvider";
import { DurationMs, SpeedKmH } from "../../interfaces/units";
import TYPES from "../../types";
import IRoadPlanner from "../road/IRoadPlanner";
import IReachableStopsFinder, { IReachableStop } from "./IReachableStopsFinder";
import ReachableStopsFinderRoadPlanner from "./ReachableStopsFinderRoadPlanner";

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
    sourceOrTargetStop: IStop,
    mode: ReachableStopsFinderMode,
    maximumDuration: DurationMs,
    minimumSpeed: SpeedKmH,
  ): Promise<IReachableStop[]> {

    const cacheKey = `${sourceOrTargetStop.id} ${mode} ${maximumDuration} ${minimumSpeed}`;
    const cacheItem = this.reachableStopsCache[cacheKey];

    if (cacheItem) {
      return cacheItem;
    }

    const reachableStops = await this.reachableStopsFinder
      .findReachableStops(sourceOrTargetStop, mode, maximumDuration, minimumSpeed);

    this.reachableStopsCache[cacheKey] = reachableStops;
    return reachableStops;
  }
}
