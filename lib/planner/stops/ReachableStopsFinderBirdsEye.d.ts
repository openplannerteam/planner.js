import ReachableStopsFinderMode from "../../enums/ReachableStopsFinderMode";
import IStop from "../../fetcher/stops/IStop";
import IStopsProvider from "../../fetcher/stops/IStopsProvider";
import { DurationMs, SpeedKmH } from "../../interfaces/units";
import IReachableStopsFinder, { IReachableStop } from "./IReachableStopsFinder";
/**
 * This [[IReachableStopsFinder]] determines its reachable stops based on the birds's-eye distance
 * to the source or target stop.
 */
export default class ReachableStopsFinderBirdsEye implements IReachableStopsFinder {
    private readonly stopsProvider;
    constructor(stopsProvider: IStopsProvider);
    findReachableStops(sourceOrTargetStop: IStop, mode: ReachableStopsFinderMode, maximumDuration: DurationMs, minimumSpeed: SpeedKmH): Promise<IReachableStop[]>;
}
