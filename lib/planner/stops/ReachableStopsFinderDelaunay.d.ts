import ReachableStopsFinderMode from "../../enums/ReachableStopsFinderMode";
import IStopsProvider from "../../fetcher/stops/IStopsProvider";
import ILocation from "../../interfaces/ILocation";
import { DurationMs, SpeedKmH } from "../../interfaces/units";
import IRoadPlanner from "../road/IRoadPlanner";
import IReachableStopsFinder, { IReachableStop } from "./IReachableStopsFinder";
export default class ReachableStopsFinderDelaunay implements IReachableStopsFinder {
    private readonly stopsProvider;
    private readonly roadPlanner;
    private triangles;
    private trianglePoints;
    constructor(stopsProvider: IStopsProvider, roadPlanner: IRoadPlanner);
    findReachableStops(location: ILocation, mode: ReachableStopsFinderMode, maximumDuration: DurationMs, minimumSpeed: SpeedKmH, profileID: string): Promise<IReachableStop[]>;
    private getNearbyStops;
    private prepare;
}
