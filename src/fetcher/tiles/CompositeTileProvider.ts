import * as turf from "@turf/turf";
import { inject, injectable } from "inversify";
import RBush from "rbush";
import { IRoutableTileIndex, RoutableTile } from "../../entities/tiles/RoutableTile";
import RoutableTileRegistry from "../../entities/tiles/RoutableTileRegistry";
import TileCoordinate from "../../entities/tiles/TileCoordinate";
import { ZoiZone } from "../../entities/tiles/ZoiZone";
import PathfinderProvider from "../../pathfinding/PathfinderProvider";
import TYPES from "../../types";
import IRoutableTileFetcher from "./IRoutableTileFetcher";
import IZoiTileFetcher from "./IZoiTileFetcherRaw";
import RoutableTileProviderDefault from "./RoutableTileProviderDefault";
import ZoiTileFetcherRaw from "./ZoiTileFetcherRaw";

@injectable()
export default class CompositeTileProvider extends RoutableTileProviderDefault {

    protected fetcher: IRoutableTileFetcher;
    protected registry: RoutableTileRegistry;
    protected tiles: IRoutableTileIndex = {};
    protected pathfinderProvider: PathfinderProvider;
    protected zoiFetcher: IZoiTileFetcher;

    constructor(
        @inject(TYPES.PathfinderProvider) pathfinderProvider: PathfinderProvider,
        @inject(TYPES.RoutableTileFetcher) fetcher: IRoutableTileFetcher,
    ) {
        super(pathfinderProvider, fetcher);
        this.zoiFetcher = new ZoiTileFetcherRaw();
    }

    public async getByTileCoords(coordinate: TileCoordinate): Promise<RoutableTile> {
        const url = this.getIdForTileCoords(coordinate);
        const zoiUrl = this.getZoiIdForTileCoords(coordinate);
        const tile = await this.getByUrl(url, zoiUrl);
        tile.coordinate = coordinate;  // todo, get these from server response
        return tile;
    }

    public getIdForTileCoords(coordinate: TileCoordinate): string {
        // only for pedestrians right now
        return `https://hdelva.be/tiles/pedestrian/${coordinate.zoom}/${coordinate.x}/${coordinate.y}`;
      }

    protected async getByUrl(url: string, zoiUrl?: string): Promise<RoutableTile> {
        if (!this.tiles[url]) {
            this.tiles[url] = this.fetcher.get(url);
            const [routableTile, zoiTile] = await Promise.all([
                this.tiles[url], this.zoiFetcher.get(zoiUrl),
            ]);

            const tree = new RBush();
            tree.load(zoiTile.getZones().map(
                (zone: ZoiZone) => {
                    const [minX, minY, maxX, maxY] = turf.bbox(zone.getBoundary().area);
                    return {
                        minX, minY, maxX, maxY, zone,
                    };
                },
            ));

            for (const nodeId of routableTile.getNodes()) {
                const node = this.registry.getNode(nodeId);
                const q = tree.search({
                    minX: node.longitude, minY: node.latitude, maxX: node.longitude, maxY: node.latitude,
                });

                const sorted = q.sort((a, b) => b.zone.degree - a.zone.degree);

                for (const match of sorted) {
                    const zone = match.zone;
                    let update = false;
                    for (const tag of zone.getSubject().getValues()) {
                        if (!node.proximity[tag] || node.proximity[tag] < zone.getDegree()) {
                            update = true;
                            break;
                        }
                    }

                    if (update && zone.contains(node)) {
                        for (const tag of zone.getSubject().getValues()) {
                            if (!node.proximity[tag] || node.proximity[tag] < zone.getDegree()) {
                                node.proximity[tag] = zone.getDegree();
                            }
                        }
                    }
                }
            }

            this.pathfinderProvider.registerEdges(routableTile.getWays());
        }

        return await this.tiles[url];
    }

    private getZoiIdForTileCoords(coordinate: TileCoordinate): string {
        return `https://hdelva.be/zoi/${coordinate.zoom}/${coordinate.x}/${coordinate.y}`;
    }
}
