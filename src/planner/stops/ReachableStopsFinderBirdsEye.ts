import { inject, injectable } from "inversify";
import ReachableStopsFinderMode from "../../enums/ReachableStopsFinderMode";
import IStop from "../../fetcher/stops/IStop";
import IStopsProvider from "../../fetcher/stops/IStopsProvider";
import { DurationMs, SpeedKmH } from "../../interfaces/units";
import TYPES from "../../types";
import Geo from "../../util/Geo";
import Units from "../../util/Units";
import IReachableStopsFinder, { IReachableStop } from "./IReachableStopsFinder";

/**
 * This [[IReachableStopsFinder]] determines its reachable stops based on the birds's-eye distance
 * to the source or target stop.
 */
@injectable()
export default class ReachableStopsFinderBirdsEye implements IReachableStopsFinder {
  private readonly stopsProvider: IStopsProvider;

  constructor(
    @inject(TYPES.StopsProvider) stopsProvider: IStopsProvider,
  ) {
    this.stopsProvider = stopsProvider;
  }

  public async findReachableStops(
    sourceOrTargetStop: IStop,
    mode: ReachableStopsFinderMode,
    maximumDuration: DurationMs,
    minimumSpeed: SpeedKmH,
  ): Promise<IReachableStop[]> {

    // Mode can be ignored since birds eye view distance is identical

    const reachableStops: IReachableStop[] = [{stop: sourceOrTargetStop, duration: 0}];

    const allStops = await this.stopsProvider.getAllStops();

    allStops.forEach((possibleTarget: IStop) => {
      const distance = Geo.getDistanceBetweenStops(sourceOrTargetStop, possibleTarget);
      const duration = Units.toDuration(distance, minimumSpeed);

      if (duration <= maximumDuration) {
        reachableStops.push({stop: possibleTarget, duration});
      }
    });

    return reachableStops;
  }
}
