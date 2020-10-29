import { RoutableTile } from "../../entities/tiles/RoutableTile";
import { RoutableTileSet } from "../../entities/tiles/RoutableTileSet";
import TileCoordinate from "../../entities/tiles/TileCoordinate";
import ILocation from "../../interfaces/ILocation";
export default interface IRoutableTileProvider {
    wait(): Promise<void>;
    getIdForLocation(zoom: number, location: ILocation): string;
    getIdForTileCoords(coordinate: TileCoordinate): string;
    getByLocation(zoom: number, location: ILocation): Promise<RoutableTile>;
    getByTileCoords(coordinate: TileCoordinate): Promise<RoutableTile>;
    getmultipleByLocation(zoom: number, locations: ILocation[]): Promise<RoutableTileSet>;
    getMultipleByTileCoords(coordinates: TileCoordinate[]): Promise<RoutableTileSet>;
}
