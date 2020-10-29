import ReachableStopsFinderMode from "../../enums/ReachableStopsFinderMode";
import IStop from "../../fetcher/stops/IStop";
import { DurationMs, SpeedKmH } from "../../interfaces/units";
import IReachableStopsFinder, { IReachableStop } from "./IReachableStopsFinder";
/**
 * This [[IReachableStopsFinder]] just returns the passed source or target stop.
 *
 * This can be a valid strategy to optimize speed if the user doesn't want to travel by foot to another stop
 */
export default class ReachableStopsFinderOnlySelf implements IReachableStopsFinder {
    findReachableStops(sourceOrTargetStop: IStop, mode: ReachableStopsFinderMode, maximumDuration: DurationMs, minimumSpeed: SpeedKmH): Promise<IReachableStop[]>;
}
