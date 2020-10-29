import ReachableStopsFinderMode from "../../enums/ReachableStopsFinderMode";
import IFootpathsProvider from "../../fetcher/footpaths/IFootpathsProvider";
import IStop from "../../fetcher/stops/IStop";
import IStopsProvider from "../../fetcher/stops/IStopsProvider";
import { DurationMs, SpeedKmH } from "../../interfaces/units";
import IReachableStopsFinder, { IReachableStop } from "./IReachableStopsFinder";
export default class ReachableStopsFinderFootpaths implements IReachableStopsFinder {
    private readonly stopsProvider;
    private readonly footpathsProvider;
    constructor(stopsProvider: IStopsProvider, footpathsProvider: IFootpathsProvider);
    findReachableStops(sourceOrTargetStop: IStop, mode: ReachableStopsFinderMode, maximumDuration: DurationMs, minimumSpeed: SpeedKmH): Promise<IReachableStop[]>;
}
