import { inject, injectable } from "inversify";
import { IRoutableTileIndex, RoutableTile } from "../../entities/tiles/RoutableTile";
import RoutableTileRegistry from "../../entities/tiles/RoutableTileRegistry";
import { RoutableTileSet } from "../../entities/tiles/RoutableTileSet";
import TileCoordinate from "../../entities/tiles/TileCoordinate";
import ILocation from "../../interfaces/ILocation";
import PathfinderProvider from "../../pathfinding/PathfinderProvider";
import TYPES from "../../types";
import { lat_to_tile, long_to_tile } from "../../util/Tiles";
import IRoutableTileFetcher from "./IRoutableTileFetcher";
import IRoutableTileProvider from "./IRoutableTileProvider";

@injectable()
export default class RoutableTileProviderDefault implements IRoutableTileProvider {

  protected fetcher: IRoutableTileFetcher;
  protected registry: RoutableTileRegistry;
  protected tiles: IRoutableTileIndex = {};
  protected pathfinderProvider: PathfinderProvider;

  constructor(
    @inject(TYPES.PathfinderProvider) pathfinderProvider: PathfinderProvider,
    @inject(TYPES.RoutableTileFetcher) fetcher: IRoutableTileFetcher,
  ) {
    this.pathfinderProvider = pathfinderProvider;
    this.fetcher = fetcher;
    this.registry = RoutableTileRegistry.getInstance();
  }

  public async wait() {
    await Promise.all(Object.values(this.tiles));
  }

  public getIdForLocation(zoom: number, location: ILocation): string {
    const y = lat_to_tile(location.latitude, zoom);
    const x = long_to_tile(location.longitude, zoom);
    const coordinate = new TileCoordinate(zoom, x, y);
    return this.getIdForTileCoords(coordinate);
  }

  public getIdForTileCoords(coordinate: TileCoordinate): string {
    return `https://tiles.openplanner.team/planet/${coordinate.zoom}/${coordinate.x}/${coordinate.y}`;
  }

  public getByLocation(zoom: number, location: ILocation): Promise<RoutableTile> {
    const y = this.lat2tile(location.latitude, zoom);
    const x = this.long2tile(location.longitude, zoom);
    const coordinate = new TileCoordinate(zoom, x, y);
    return this.getByTileCoords(coordinate);
  }

  public async getByTileCoords(coordinate: TileCoordinate): Promise<RoutableTile> {
    const url = this.getIdForTileCoords(coordinate);
    const tile = await this.getByUrl(url);
    tile.coordinate = coordinate;  // todo, get these from server response
    return tile;
  }

  public async getmultipleByLocation(zoom: number, locations: ILocation[]): Promise<RoutableTileSet> {
    const tiles = await Promise.all(locations.map((location) => {
      return this.getByLocation(zoom, location);
    }));

    return new RoutableTileSet(tiles);
  }

  public async getMultipleByTileCoords(coordinates: TileCoordinate[]): Promise<RoutableTileSet> {
    const tiles = await Promise.all(coordinates.map((coordinate) => {
      return this.getByTileCoords(coordinate);
    }));

    return new RoutableTileSet(tiles);
  }

  protected async getByUrl(url: string): Promise<RoutableTile> {
    if (!this.tiles[url]) {
      this.tiles[url] = this.fetcher.get(url);
      const tile = await this.tiles[url];
      this.pathfinderProvider.registerEdges(tile.getWays());
    }

    return await this.tiles[url];
  }

  private long2tile(lon: number, zoom: number) {
    return (Math.floor((lon + 180) / 360 * Math.pow(2, zoom)));
  }

  private lat2tile(lat: number, zoom: number) {
    return (Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1
      / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)));
  }
}
