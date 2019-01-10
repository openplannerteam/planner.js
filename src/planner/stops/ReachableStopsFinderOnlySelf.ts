import { injectable } from "inversify";
import IStop from "../../fetcher/stops/IStop";
import { DurationMs, SpeedkmH } from "../../interfaces/units";
import IReachableStopsFinder, { IReachableStop } from "./IReachableStopsFinder";
import ReachableStopsFinderMode from "./ReachableStopsFinderMode";

@injectable()
export default class ReachableStopsFinderOnlySelf implements IReachableStopsFinder {

  public async findReachableStops(
    sourceOrTargetStop: IStop,
    mode: ReachableStopsFinderMode,
    maximumDuration: DurationMs,
    minimumSpeed: SpeedkmH,
  ): Promise<IReachableStop[]> {
    return [{ stop: sourceOrTargetStop, duration: 0 }];
  }
}
