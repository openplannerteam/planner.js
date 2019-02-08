import { inject, injectable } from "inversify";
import ReachableStopsFinderMode from "../../enums/ReachableStopsFinderMode";
import IStop from "../../fetcher/stops/IStop";
import IStopsProvider from "../../fetcher/stops/IStopsProvider";
import { DurationMs, SpeedKmH } from "../../interfaces/units";
import TYPES from "../../types";
import IReachableStopsFinder, { IReachableStop } from "./IReachableStopsFinder";
import ReachableStopsFinderBirdsEye from "./ReachableStopsFinderBirdsEye";

/**
 * This [[IReachableStopsFinder]] forms a caching layer in front of a [[ReachableStopsFinderBirdsEye]] instance,
 * so all the distances don't have to be calculated repeatedly
 */
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
    minimumSpeed: SpeedKmH,
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
