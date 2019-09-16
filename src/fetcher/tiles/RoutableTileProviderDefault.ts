import { inject, injectable } from "inversify";
import { RoutableTileCoordinate } from "../../entities/tiles/coordinate";
import RoutableTileRegistry from "../../entities/tiles/registry";
import { RoutableTileSet } from "../../entities/tiles/set";
import { IRoutableTileIndex, RoutableTile } from "../../entities/tiles/tile";
import ILocation from "../../interfaces/ILocation";
import TYPES from "../../types";
import { lat_to_tile, long_to_tile } from "../../util/Tiles";
import IRoutableTileFetcher from "./IRoutableTileFetcher";
import IRoutableTileProvider from "./IRoutableTileProvider";

@injectable()
export default class RoutableTileProviderDefault implements IRoutableTileProvider {

  protected fetcher: IRoutableTileFetcher;
  protected registry: RoutableTileRegistry;
  protected tiles: IRoutableTileIndex = {};

  constructor(
    @inject(TYPES.RoutableTileFetcher) fetcher: IRoutableTileFetcher,
    @inject(TYPES.RoutableTileRegistry) registry: RoutableTileRegistry,
  ) {
    this.fetcher = fetcher;
    this.registry = registry;
  }

  public async wait() {
    await Promise.all(Object.values(this.tiles));
  }

  public getIdForLocation(zoom: number, location: ILocation): string {
    const y = lat_to_tile(location.latitude, zoom);
    const x = long_to_tile(location.longitude, zoom);
    const coordinate = new RoutableTileCoordinate(zoom, x, y);
    return this.getIdForTileCoords(coordinate);
  }

  public getIdForTileCoords(coordinate: RoutableTileCoordinate): string {
    return `https://tiles.openplanner.team/planet/${coordinate.zoom}/${coordinate.x}/${coordinate.y}`;
  }

  public getByLocation(zoom: number, location: ILocation): Promise<RoutableTile> {
    const y = this.lat2tile(location.latitude, zoom);
    const x = this.long2tile(location.longitude, zoom);
    const coordinate = new RoutableTileCoordinate(zoom, x, y);
    return this.getByTileCoords(coordinate);
  }

  public async getByTileCoords(coordinate: RoutableTileCoordinate): Promise<RoutableTile> {
    const url = this.getIdForTileCoords(coordinate);
    const tile = await this.getByUrl(url);
    tile.coordinate = coordinate;  // todo, get these from server response
    return tile;
  }

  public async getByUrl(url: string): Promise<RoutableTile> {
    if (!this.tiles[url]) {
      this.tiles[url] = this.fetcher.get(url);
    }

    return await this.tiles[url];
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
