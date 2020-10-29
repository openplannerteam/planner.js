import LDFetch from "ldfetch";
import { RoutableTile } from "../../entities/tiles/tile";
import PathfinderProvider from "../../pathfinding/PathfinderProvider";
import RoutableTileFetcherDefault from "./RoutableTileFetcherDefault";
export default class RoutableTileFetcherExtended extends RoutableTileFetcherDefault {
    constructor(ldFetch: LDFetch, pathfinder: PathfinderProvider);
    get(url: string): Promise<RoutableTile>;
    protected getWaysView(): import("../../loader/views").IndexThingView<import("../../entities/tiles/way").RoutableTileWay>;
}
