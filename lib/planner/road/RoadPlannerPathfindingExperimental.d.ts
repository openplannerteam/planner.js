import { AsyncIterator } from "asynciterator";
import IProfileProvider from "../../fetcher/profiles/IProfileProvider";
import IRoutableTileProvider from "../../fetcher/tiles/IRoutableTileProvider";
import IPath from "../../interfaces/IPath";
import PathfinderProvider from "../../pathfinding/PathfinderProvider";
import ILocationResolver from "../../query-runner/ILocationResolver";
import IResolvedQuery from "../../query-runner/IResolvedQuery";
import IRoadPlanner from "./IRoadPlanner";
export default class RoadPlannerPathfindingExperimental implements IRoadPlanner {
    private baseTileProvider;
    private transitTileProvider;
    private pathfinderProvider;
    private profileProvider;
    private locationResolver;
    private registry;
    private eventBus;
    private reachedTiles;
    private localTiles;
    constructor(baseTileProvider: IRoutableTileProvider, transitTileProvider: IRoutableTileProvider, pathfinderProvider: PathfinderProvider, profileProvider: IProfileProvider, locationResolver: ILocationResolver);
    plan(query: IResolvedQuery): Promise<AsyncIterator<IPath>>;
    private getPathBetweenLocations;
    private _innerPath;
    private pickTile;
    private fetchTile;
    private embedLocation;
}
