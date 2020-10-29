import LDFetch from "ldfetch";
import { IRoutableTileNodeIndex, RoutableTileNode } from "../../entities/tiles/node";
import RoutableTileRegistry from "../../entities/tiles/registry";
import { RoutableTile } from "../../entities/tiles/tile";
import { IRoutableTileWayIndex, RoutableTileWay } from "../../entities/tiles/way";
import { LDLoader } from "../../loader/ldloader";
import { IndexThingView } from "../../loader/views";
import PathfinderProvider from "../../pathfinding/PathfinderProvider";
import IRoutableTileFetcher from "./IRoutableTileFetcher";
export default class RoutableTileFetcherDefault implements IRoutableTileFetcher {
    protected ldFetch: LDFetch;
    protected ldLoader: LDLoader;
    protected pathfinderProvider: PathfinderProvider;
    protected routableTileRegistry: RoutableTileRegistry;
    constructor(ldFetch: LDFetch, pathfinderProvider: PathfinderProvider);
    get(url: string): Promise<RoutableTile>;
    protected processTileData(url: string, nodes: IRoutableTileNodeIndex, ways: IRoutableTileWayIndex): RoutableTile;
    protected getNodesView(): IndexThingView<RoutableTileNode>;
    protected getWaysView(): IndexThingView<RoutableTileWay>;
}
