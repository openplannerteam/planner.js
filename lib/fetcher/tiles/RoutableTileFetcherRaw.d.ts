import { RoutableTile } from "../../entities/tiles/RoutableTile";
import { IRoutableTileNodeIndex } from "../../entities/tiles/RoutableTileNode";
import RoutableTileRegistry from "../../entities/tiles/RoutableTileRegistry";
import { IRoutableTileWayIndex } from "../../entities/tiles/RoutableTileWay";
import IRoutableTileFetcher from "./IRoutableTileFetcher";
export default class RoutableTileFetcherRaw implements IRoutableTileFetcher {
    protected mapping: object;
    protected routableTileRegistry: RoutableTileRegistry;
    constructor();
    get(url: string): Promise<RoutableTile>;
    protected parseResponseLength(response: any): number;
    protected processTileData(url: string, nodes: IRoutableTileNodeIndex, ways: IRoutableTileWayIndex): RoutableTile;
    private createNode;
    private createWay;
}
