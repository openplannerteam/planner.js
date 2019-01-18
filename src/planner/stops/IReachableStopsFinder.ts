import ReachableStopsFinderMode from "../../enums/ReachableStopsFinderMode";
import IStop from "../../fetcher/stops/IStop";
import { DurationMs, SpeedKmH } from "../../interfaces/units";

export default interface IReachableStopsFinder {
  findReachableStops: (
    sourceOrTargetStop: IStop,
    mode: ReachableStopsFinderMode,
    maximumDuration: DurationMs,
    minimumSpeed: SpeedKmH,
  ) => Promise<IReachableStop[]>;
}

export interface IReachableStop {
  stop: IStop;
  duration: DurationMs;
}
