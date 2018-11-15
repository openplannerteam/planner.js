import { inject, injectable } from "inversify";
import IStop from "../../fetcher/stops/IStop";
import IStopsFetcherMediator from "../../fetcher/stops/IStopsFetcherMediator";
import { DurationMs, SpeedkmH } from "../../interfaces/units";
import TYPES from "../../types";
import Geo from "../../util/Geo";
import Units from "../../util/Units";
import IReachableStopsFinder, { IReachableStop } from "./IReachableStopsFinder";
import ReachableStopsFinderMode from "./ReachableStopsFinderMode";

@injectable()
export default class ReachableStopsFinderBirdsEye implements IReachableStopsFinder {
  private readonly stopsFetcherMediator: IStopsFetcherMediator;

  constructor(
    @inject(TYPES.StopsFetcherMediator) stopsFetcherMediator: IStopsFetcherMediator,
  ) {
    this.stopsFetcherMediator = stopsFetcherMediator;
  }

  public async findReachableStops(
    source: IStop,
    mode: ReachableStopsFinderMode,
    maximumDuration: DurationMs,
    minimumSpeed: SpeedkmH,
  ): Promise<IReachableStop[]> {

    // Mode can be ignored since birds eye view distance is identical

    const allStops = await this.stopsFetcherMediator.getAllStops();

    return allStops.map((possibleTarget: IStop): IReachableStop => {
      if (possibleTarget.id === source.id) {
        return {stop: source, duration: 0};
      }

      const distance = Geo.getDistanceBetweenStops(source, possibleTarget);
      const duration = Units.toDuration(distance, minimumSpeed);

      if (duration <= maximumDuration) {
        return {stop: possibleTarget, duration};
      }
    }).filter((reachableStop) => !!reachableStop);
  }
}
