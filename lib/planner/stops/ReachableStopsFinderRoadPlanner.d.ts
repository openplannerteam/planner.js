import ReachableStopsFinderMode from "../../enums/ReachableStopsFinderMode";
import IStopsProvider from "../../fetcher/stops/IStopsProvider";
import ILocation from "../../interfaces/ILocation";
import { DurationMs, SpeedKmH } from "../../interfaces/units";
import IRoadPlanner from "../road/IRoadPlanner";
import IReachableStopsFinder, { IReachableStop } from "./IReachableStopsFinder";
/**
 * This [[IReachableStopsFinder]] uses the registered [[IRoadPlanner]] to find reachable stops.
 * It makes an initial selection of stops based on bird's-eye distance, after which a road planner query gets executed
 * for each of these stops.
 */
export default class ReachableStopsFinderRoadPlanner implements IReachableStopsFinder {
    private readonly stopsProvider;
    private readonly roadPlanner;
    constructor(stopsProvider: IStopsProvider, roadPlanner: IRoadPlanner);
    findReachableStops(location: ILocation, mode: ReachableStopsFinderMode, maximumDuration: DurationMs, minimumSpeed: SpeedKmH, profileID: string): Promise<IReachableStop[]>;
}
