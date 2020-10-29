import ReachableStopsFinderMode from "../../enums/ReachableStopsFinderMode";
import IStopsProvider from "../../fetcher/stops/IStopsProvider";
import ILocation from "../../interfaces/ILocation";
import { DurationMs, SpeedKmH } from "../../interfaces/units";
import IRoadPlanner from "../road/IRoadPlanner";
import IReachableStopsFinder, { IReachableStop } from "./IReachableStopsFinder";
/**
 * This [[IReachableStopsFinder]] forms a caching layer in front of a [[ReachableStopsFinderRoadPlanner]] instance,
 * so all the queries don't have to be executed repeatedly
 */
export default class ReachableStopsFinderRoadPlannerCached implements IReachableStopsFinder {
    private readonly reachableStopsFinder;
    private readonly reachableStopsCache;
    constructor(stopsProvider: IStopsProvider, roadPlanner: IRoadPlanner);
    findReachableStops(location: ILocation, mode: ReachableStopsFinderMode, maximumDuration: DurationMs, minimumSpeed: SpeedKmH, profileID: string): Promise<IReachableStop[]>;
}
