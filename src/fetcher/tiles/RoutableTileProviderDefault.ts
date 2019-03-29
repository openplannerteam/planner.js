import { inject, injectable } from "inversify";
import { RoutableTileCoordinate } from "../../entities/tiles/coordinate";
import { RoutableTileSet } from "../../entities/tiles/set";
import { IRoutableTileIndex, RoutableTile } from "../../entities/tiles/tile";
import ILocation from "../../interfaces/ILocation";
import TYPES from "../../types";
import IRoutableTileFetcher from "./IRoutableTileFetcher";
import IRoutableTileProvider from "./IRoutableTileProvider";

@injectable()
export default class RoutableTileProviderDefault implements IRoutableTileProvider {

  private fetcher: IRoutableTileFetcher;
  private tiles: IRoutableTileIndex = {};

  constructor(
    @inject(TYPES.RoutableTileFetcher) fetcher: IRoutableTileFetcher,
  ) {
    this.fetcher = fetcher;
  }

  public getByLocation(zoom: number, location: ILocation): Promise<RoutableTile> {
    const latitudeTile = this.lat2tile(location.latitude, zoom);
    const longitudeTile = this.long2tile(location.longitude, zoom);
    const coordinate = new RoutableTileCoordinate(zoom, latitudeTile, longitudeTile);
    return this.getByTileCoords(coordinate);
  }

  public async getByTileCoords(coordinate: RoutableTileCoordinate): Promise<RoutableTile> {
    const { zoom: z, longitude: x, latitude: y } = coordinate;
    const url = `https://tiles.openplanner.team/planet/${z}/${x}/${y}`;
    const tile = await this.getByUrl(url);
    tile.coordinate = coordinate;  // todo, get these from server response
    return tile;
  }

  public async getByUrl(url: string): Promise<RoutableTile> {
    if (!this.tiles[url]) {
      const tile = await this.fetcher.get(url);
      this.tiles[url] = tile;
    }

    console.log(new Date(), Object.values(this.tiles).length, url);

    return this.tiles[url];
  }

  public async getMultipleByUrl(urls: string[]): Promise<RoutableTileSet> {
    const tiles = await Promise.all(urls.map((url) => {
      return this.getByUrl(url);
    }));

    return new RoutableTileSet(tiles);
  }

  public async getmultipleByLocation(zoom: number, locations: ILocation[]): Promise<RoutableTileSet> {
    const tiles = await Promise.all(locations.map((location) => {
      return this.getByLocation(zoom, location);
    }));

    return new RoutableTileSet(tiles);
  }

  public async getMultipleByTileCoords(coordinates: RoutableTileCoordinate[]): Promise<RoutableTileSet> {
    const tiles = await Promise.all(coordinates.map((coordinate) => {
      return this.getByTileCoords(coordinate);
    }));

    return new RoutableTileSet(tiles);
  }

  private long2tile(lon: number, zoom: number) {
    return (Math.floor((lon + 180) / 360 * Math.pow(2, zoom)));
  }

  private lat2tile(lat: number, zoom: number) {
    return (Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1
      / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)));
  }
}
