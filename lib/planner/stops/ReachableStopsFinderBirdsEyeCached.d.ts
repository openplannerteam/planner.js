import ReachableStopsFinderMode from "../../enums/ReachableStopsFinderMode";
import IStop from "../../fetcher/stops/IStop";
import IStopsProvider from "../../fetcher/stops/IStopsProvider";
import { DurationMs, SpeedKmH } from "../../interfaces/units";
import IReachableStopsFinder, { IReachableStop } from "./IReachableStopsFinder";
/**
 * This [[IReachableStopsFinder]] forms a caching layer in front of a [[ReachableStopsFinderBirdsEye]] instance,
 * so all the distances don't have to be calculated repeatedly
 */
export default class ReachableStopsFinderBirdsEyeCached implements IReachableStopsFinder {
    private readonly reachableStopsFinder;
    private readonly reachableStopsCache;
    constructor(stopsProvider: IStopsProvider);
    findReachableStops(sourceOrTargetStop: IStop, mode: ReachableStopsFinderMode, maximumDuration: DurationMs, minimumSpeed: SpeedKmH): Promise<IReachableStop[]>;
}
