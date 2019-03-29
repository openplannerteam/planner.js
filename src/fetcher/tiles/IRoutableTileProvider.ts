import { RoutableTileCoordinate } from "../../entities/tiles/coordinate";
import { RoutableTileSet } from "../../entities/tiles/set";
import { RoutableTile } from "../../entities/tiles/tile";
import ILocation from "../../interfaces/ILocation";

export default interface IRoutableTileProvider {
    getByUrl(url: string): Promise<RoutableTile>;
    getByLocation(zoom: number, location: ILocation): Promise<RoutableTile>;
    getByTileCoords(coordinate: RoutableTileCoordinate): Promise<RoutableTile>;

    getMultipleByUrl(urls: string[]): Promise<RoutableTileSet>;
    getmultipleByLocation(zoom: number, locations: ILocation[]): Promise<RoutableTileSet>;
    getMultipleByTileCoords(coordinates: RoutableTileCoordinate[]): Promise<RoutableTileSet>;
}
