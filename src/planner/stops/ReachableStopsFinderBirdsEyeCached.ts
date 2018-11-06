import { inject, injectable } from "inversify";
import IStop from "../../fetcher/stops/IStop";
import IStopsFetcherMediator from "../../fetcher/stops/IStopsFetcherMediator";
import { DurationMs, SpeedkmH } from "../../interfaces/units";
import TYPES from "../../types";
import Geo from "../../util/Geo";
import Units from "../../util/Units";
import IReachableStopsFinder, { IReachableStop } from "./IReachableStopsFinder";

@injectable()
export default class ReachableStopsFinderBirdsEyeCached implements IReachableStopsFinder {
  private readonly stopsFetcherMediator: IStopsFetcherMediator;

  private allStops: IStop[];
  private reachableStopsCache: {[cacheKey: string]: IReachableStop[]};

  constructor(
    @inject(TYPES.StopsFetcherMediator) stopsFetcherMediator: IStopsFetcherMediator,
  ) {
    this.stopsFetcherMediator = stopsFetcherMediator;
    this.reachableStopsCache = {};
  }

  public async findReachableStops(
    source: IStop,
    maximumDuration: DurationMs,
    minimumSpeed: SpeedkmH,
  ): Promise<IReachableStop[]> {

    const cacheKey = `${source.id} ${maximumDuration} ${minimumSpeed}`;
    const cacheItem = this.reachableStopsCache[cacheKey];

    if (cacheItem) {
      return cacheItem;
    }

    const allStops = await this.getAllStops();

    const reachableStops = allStops.map((possibleTarget: IStop): IReachableStop => {
      if (possibleTarget.id === source.id) {
        return {stop: source, duration: 0};
      }

      const distance = Geo.getDistanceBetweenStops(source, possibleTarget);
      const duration = Units.toDuration(distance, minimumSpeed);

      if (duration <= maximumDuration) {
        return {stop: possibleTarget, duration};
      }
    }).filter((reachableStop) => !!reachableStop);

    this.reachableStopsCache[cacheKey] = reachableStops;
    return reachableStops;
  }

  private async getAllStops() {
    if (!this.allStops) {
      this.allStops = await this.stopsFetcherMediator.getAllStops();
    }

    return this.allStops;

  }
}
