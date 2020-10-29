import ReachableStopsFinderMode from "../../enums/ReachableStopsFinderMode";
import IFootpathsProvider from "../../fetcher/footpaths/IFootpathsProvider";
import IStop from "../../fetcher/stops/IStop";
import IStopsProvider from "../../fetcher/stops/IStopsProvider";
import { DurationMs, SpeedKmH } from "../../interfaces/units";
import { IReachableStop } from "./IReachableStopsFinder";
import ReachableStopsFinderFootpaths from "./ReachableStopsFinderFootpaths";
export default class ReachableStopsFinderFootpathsVerbose extends ReachableStopsFinderFootpaths {
    private done;
    constructor(stopsProvider: IStopsProvider, footpathsProvider: IFootpathsProvider);
    findReachableStops(sourceOrTargetStop: IStop, mode: ReachableStopsFinderMode, maximumDuration: DurationMs, minimumSpeed: SpeedKmH): Promise<IReachableStop[]>;
}
