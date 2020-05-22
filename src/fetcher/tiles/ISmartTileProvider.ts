import { TransitTile, RoutableTile } from "../../entities/tiles/tile";
import ILocation from "../../interfaces/ILocation";
import { RoutableTileNode } from "../../entities/tiles/node";

export default interface ISmartTileProvider {
    wait(): Promise<void>;
    selectDataSources(catalogUrl: string, profileID: string)
    getByUrl(url: string): Promise<TransitTile>;
    getRTByUrl(url:string): Promise<RoutableTile>;
    fetchCorrectTile(node: RoutableTileNode, local?: boolean);
    traverseTransitTree(node: RoutableTileNode);
    traverseRoutableTree(node: RoutableTileNode);
    addLocalNodes(nodes: ILocation[]);
    getTileFromCache(id:string);
}
