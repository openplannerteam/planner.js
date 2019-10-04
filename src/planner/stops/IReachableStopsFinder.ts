import ReachableStopsFinderMode from "../../enums/ReachableStopsFinderMode";
import IStop from "../../fetcher/stops/IStop";
import ILocation from "../../interfaces/ILocation";
import { DurationMs, SpeedKmH } from "../../interfaces/units";

/**
 * A reachable stops finder searches for stops that are reachable "on foot" . This can mean e.g. a folding bike if
 * that scenario is implemented by the registered [[IReachableStopsFinder]]
 */
export default interface IReachableStopsFinder {
  findReachableStops: (
    sourceOrTargetStop: ILocation,
    mode: ReachableStopsFinderMode,
    maximumDuration: DurationMs,
    minimumSpeed: SpeedKmH,
    profileID: string,
  ) => Promise<IReachableStop[]>;
}

/**
 * An [[IReachableStop]] wraps an [[IStop]] instance and the estimated duration to get to that stop
 */
export interface IReachableStop {
  stop: IStop;
  duration: DurationMs;
  id?: string;
}
