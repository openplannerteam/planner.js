import { RoutableTileCoordinate } from "../../entities/tiles/coordinate";
import { TransitTileSet } from "../../entities/tiles/set";
import { TransitTile, RoutableTile } from "../../entities/tiles/tile";
import ILocation from "../../interfaces/ILocation";
import { RoutableTileNode } from "../../entities/tiles/node";

//keeps routabletilecoordinate, as a coordinate doesnt alter based on routable of transit tiles, so maybe change the name of RoutableTileCoordinate instead
export default interface ISmartTileProvider {
    wait(): Promise<void>;

    selectDataSources(catalogUrl: string, profileID: string)

    // getIdForLocation(zoom: number, location: ILocation, local?:boolean): string;
    // getIdForTileCoords(coordinate: RoutableTileCoordinate): string;

    getByUrl(url: string): Promise<TransitTile>;
    getRTByUrl(url:string): Promise<RoutableTile>;
    // getByLocation(zoom: number, location: ILocation): Promise<TransitTile | RoutableTile>;
    // getByTileCoords(coordinate: RoutableTileCoordinate): Promise<TransitTile | RoutableTile>;

    //functions in this block are added by Thomas Neuser
    fetchCorrectTile(node: RoutableTileNode, local?: boolean);
    traverseTransitTree(node: RoutableTileNode);
    traverseRoutableTree(node: RoutableTileNode);
    addLocalNodes(nodes: ILocation[]);
    getTileFromCache(id:string);

    // getMultipleByUrl(urls: string[]): Promise<TransitTileSet>;
    // getmultipleByLocation(zoom: number, locations: ILocation[]): Promise<TransitTileSet>;
    // getMultipleByTileCoords(coordinates: RoutableTileCoordinate[]): Promise<TransitTileSet>;
}
