import { inject, injectable } from "inversify";
import IStop from "../../fetcher/stops/IStop";
import IStopsProvider from "../../fetcher/stops/IStopsProvider";
import { DurationMs, SpeedkmH } from "../../interfaces/units";
import TYPES from "../../types";
import IReachableStopsFinder, { IReachableStop } from "./IReachableStopsFinder";
import ReachableStopsFinderBirdsEye from "./ReachableStopsFinderBirdsEye";
import ReachableStopsFinderMode from "./ReachableStopsFinderMode";

@injectable()
export default class ReachableStopsFinderBirdsEyeCached implements IReachableStopsFinder {
  private readonly reachableStopsFinder: ReachableStopsFinderBirdsEye;
  private readonly reachableStopsCache: {[cacheKey: string]: IReachableStop[]};

  constructor(
    @inject(TYPES.StopsProvider) stopsProvider: IStopsProvider,
  ) {
    this.reachableStopsFinder = new ReachableStopsFinderBirdsEye(stopsProvider);
    this.reachableStopsCache = {};
  }

  public async findReachableStops(
    sourceOrTargetStop: IStop,
    mode: ReachableStopsFinderMode,
    maximumDuration: DurationMs,
    minimumSpeed: SpeedkmH,
  ): Promise<IReachableStop[]> {

    // Mode can be ignored since birds eye view distance is identical

    const cacheKey = `${sourceOrTargetStop.id} ${maximumDuration} ${minimumSpeed}`;
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
