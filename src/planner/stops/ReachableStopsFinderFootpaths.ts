import { inject, injectable } from "inversify";
import ReachableStopsFinderMode from "../../enums/ReachableStopsFinderMode";
import IFootpathsProvider from "../../fetcher/footpaths/IFootpathsProvider";
import IStop from "../../fetcher/stops/IStop";
import IStopsProvider from "../../fetcher/stops/IStopsProvider";
import { DurationMs, SpeedKmH } from "../../interfaces/units";
import TYPES from "../../types";
import Units from "../../util/Units";
import IReachableStopsFinder, { IReachableStop } from "./IReachableStopsFinder";

@injectable()
export default class ReachableStopsFinderFootpaths implements IReachableStopsFinder {
  private readonly stopsProvider: IStopsProvider;
  private readonly footpathsProvider: IFootpathsProvider;

  constructor(
    @inject(TYPES.StopsProvider) stopsProvider: IStopsProvider,
    @inject(TYPES.FootpathsProvider) footpathsProvider: IFootpathsProvider,
  ) {
    this.stopsProvider = stopsProvider;
    this.footpathsProvider = footpathsProvider;
  }

  public async findReachableStops(
    sourceOrTargetStop: IStop,
    mode: ReachableStopsFinderMode,
    maximumDuration: DurationMs,
    minimumSpeed: SpeedKmH,
  ): Promise<IReachableStop[]> {

    const reachableStops: IReachableStop[] = [{ stop: sourceOrTargetStop, duration: 0 }];

    const footpaths = await this.footpathsProvider.get(sourceOrTargetStop);
    for (const footpath of Object.values(footpaths)) {
        let otherStop: IStop;

        if (sourceOrTargetStop.id === footpath.from) {
            otherStop = await this.stopsProvider.getStopById(footpath.to);
        } else if (sourceOrTargetStop.id === footpath.to) {
            otherStop = await this.stopsProvider.getStopById(footpath.from);
        }

        if (otherStop) {
            const duration = Units.toDuration(footpath.distance, minimumSpeed);
            reachableStops.push({stop: otherStop, duration, id: footpath.id});
        }
    }

    return reachableStops;
  }
}
