import { injectable, inject } from "inversify";
import { TransitTileSet } from "../../entities/tiles/set";
import ITransitTileProvider from "./ITransitTileProvider";
import ITransitTileFetcher from "./ITransitTileFetcher";
import RoutableTileRegistry from "../../entities/tiles/registry";
import { ITransitTileIndex, TransitTile } from "../../entities/tiles/tile";
import ILocation from "../../interfaces/ILocation";
import { RoutableTileCoordinate } from "../../entities/tiles/coordinate";
import { lat_to_tile, long_to_tile } from "../../util/Tiles";
import TYPES from "../../types";

@injectable()
export default class TransitTileProviderDefault implements ITransitTileProvider {

    protected fetcher: ITransitTileFetcher;
    protected registry: RoutableTileRegistry;
    protected tiles: ITransitTileIndex = {};

    constructor(
        @inject(TYPES.TransitTileFetcher) fetcher: ITransitTileFetcher,
    ) {
        this.fetcher = fetcher;
        this.registry = RoutableTileRegistry.getInstance();
    }

    //not sure what this does
    public async wait() {
        await Promise.all(Object.values(this.tiles));
    }

    public getIdForLocation(zoom: number, location: ILocation): string {
        const y = lat_to_tile(location.latitude, zoom);
        const x = long_to_tile(location.longitude, zoom);
        const coordinate = new RoutableTileCoordinate(zoom, x, y);
        return this.getIdForTileCoords(coordinate);
    }

    //this URL is hardcoded to my own (local) fileserver with transit tile data, + points to blabla.json
    public getIdForTileCoords(coordinate: RoutableTileCoordinate): string {
        return `http://192.168.56.1:8080/car/transit/${coordinate.zoom}/${coordinate.x}/${coordinate.y}.json`;
    }

    public getByLocation(zoom: number, location: ILocation): Promise<TransitTile> {
        const y = this.lat2tile(location.latitude, zoom);
        const x = this.long2tile(location.longitude, zoom);
        const coordinate = new RoutableTileCoordinate(zoom, x, y);
        return this.getByTileCoords(coordinate);
    }

    public async getByTileCoords(coordinate: RoutableTileCoordinate): Promise<TransitTile> {
        const url = this.getIdForTileCoords(coordinate);
        const tile = await this.getByUrl(url);
        tile.coordinate = coordinate;  // todo, get these from server response -> ?
        return tile;
    }

    public async getByUrl(url: string): Promise<TransitTile> {
        if (!this.tiles[url]) {
            this.tiles[url] = this.fetcher.get(url);
        }

        return await this.tiles[url];
    }

    public async getMultipleByUrl(urls: string[]): Promise<TransitTileSet> {
        const tiles = await Promise.all(urls.map((url) => {
            return this.getByUrl(url);
        }));

        return new TransitTileSet(tiles);
    }

    public async getmultipleByLocation(zoom: number, locations: ILocation[]): Promise<TransitTileSet> {
        const tiles = await Promise.all(locations.map((location) => {
          return this.getByLocation(zoom, location);
        }));
    
        return new TransitTileSet(tiles);
      }
    
      public async getMultipleByTileCoords(coordinates: RoutableTileCoordinate[]): Promise<TransitTileSet> {
        const tiles = await Promise.all(coordinates.map((coordinate) => {
          return this.getByTileCoords(coordinate);
        }));
    
        return new TransitTileSet(tiles);
      }



    private long2tile(lon: number, zoom: number) {
        return (Math.floor((lon + 180) / 360 * Math.pow(2, zoom)));
    }

    private lat2tile(lat: number, zoom: number) {
        return (Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1
            / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)));
    }

}