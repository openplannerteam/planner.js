import IStop from "../../fetcher/stops/IStop";
import { DurationMs, SpeedkmH } from "../../interfaces/units";
import ReachableStopsFinderMode from "./ReachableStopsFinderMode";

export default interface IReachableStopsFinder {
  findReachableStops: (
    sourceStop: IStop,
    mode: ReachableStopsFinderMode,
    maximumDuration: DurationMs,
    minimumSpeed: SpeedkmH,
  ) => Promise<IReachableStop[]>;
}

export interface IReachableStop {
  stop: IStop;
  duration: DurationMs;
}
