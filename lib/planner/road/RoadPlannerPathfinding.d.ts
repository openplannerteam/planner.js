import { AsyncIterator } from "asynciterator";
import IProfileProvider from "../../fetcher/profiles/IProfileProvider";
import IRoutableTileProvider from "../../fetcher/tiles/IRoutableTileProvider";
import IPath from "../../interfaces/IPath";
import PathfinderProvider from "../../pathfinding/PathfinderProvider";
import ILocationResolver from "../../query-runner/ILocationResolver";
import IResolvedQuery from "../../query-runner/IResolvedQuery";
import IRoadPlanner from "./IRoadPlanner";
export default class RoadPlannerPathfinding implements IRoadPlanner {
    private tileProvider;
    private pathfinderProvider;
    private profileProvider;
    private locationResolver;
    private registry;
    private eventBus;
    private reachedTiles;
    constructor(tileProvider: IRoutableTileProvider, pathfinderProvider: PathfinderProvider, profileProvider: IProfileProvider, locationResolver: ILocationResolver);
    plan(query: IResolvedQuery): Promise<AsyncIterator<IPath>>;
    private getPathBetweenLocations;
    private _innerPath;
    private fetchTile;
    private embedLocation;
}
