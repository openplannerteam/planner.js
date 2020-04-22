import { RoutableTileCoordinate } from "../../entities/tiles/coordinate";
import { TransitTileSet } from "../../entities/tiles/set";
import { TransitTile } from "../../entities/tiles/tile";
import ILocation from "../../interfaces/ILocation";

//keeps routabletilecoordinate, as a coordinate doesnt alter based on routable of transit tiles, so maybe change the name of RoutableTileCoordinate instead
export default interface ITransitTileProvider {
    wait(): Promise<void>;

    getIdForLocation(zoom: number, location: ILocation): string;
    getIdForTileCoords(coordinate: RoutableTileCoordinate): string;

    getByUrl(url: string): Promise<TransitTile>;
    getByLocation(zoom: number, location: ILocation): Promise<TransitTile>;
    getByTileCoords(coordinate: RoutableTileCoordinate): Promise<TransitTile>;

    getMultipleByUrl(urls: string[]): Promise<TransitTileSet>;
    getmultipleByLocation(zoom: number, locations: ILocation[]): Promise<TransitTileSet>;
    getMultipleByTileCoords(coordinates: RoutableTileCoordinate[]): Promise<TransitTileSet>;
}
