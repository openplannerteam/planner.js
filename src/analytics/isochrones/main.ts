import "isomorphic-fetch";
import "reflect-metadata";
import inBBox from "tiles-in-bbox";
import Context from "../../Context";
import { RoutableTileCoordinate } from "../../entities/tiles/coordinate";
import RoutableTileRegistry from "../../entities/tiles/registry";
import IRoutableTileProvider from "../../fetcher/tiles/IRoutableTileProvider";
import ILocation from "../../interfaces/ILocation";
import defaultContainer from "../../inversify.config";
import { IPathTree } from "../../pathfinding/pathfinder";
import PathfinderProvider from "../../pathfinding/PathfinderProvider";
import TYPES from "../../types";
import Geo from "../../util/Geo";
import { getDistanceBetweenTiles, getNeighborTiles, toTileCoordinate } from "./util";
import { visualizeIsochrone } from "./visualize";

interface ITileFrontier {
    [id: string]: [RoutableTileCoordinate, number];
}

export default class IsochroneGenerator {
    private context: Context;

    private pathfinderProvider: PathfinderProvider;
    private tileProvider: IRoutableTileProvider;
    private reachedTiles: Set<string>;
    private tileFrontier: ITileFrontier;
    private startPoint: ILocation;
    private registry: RoutableTileRegistry;

    constructor(container = defaultContainer) {
        this.context = container.get<Context>(TYPES.Context);
        this.context.setContainer(container);
        this.tileProvider = container.get<IRoutableTileProvider>(TYPES.RoutableTileProvider);
        this.pathfinderProvider = container.get<PathfinderProvider>(TYPES.PathfinderProvider);
        this.registry = container.get<RoutableTileRegistry>(TYPES.RoutableTileRegistry);
        this.reachedTiles = new Set();
        this.tileFrontier = {};
    }

    public async init(point: ILocation) {
        this.startPoint = point;
        await this.fetchInitialTiles(point);
        const initialTile = toTileCoordinate(point.latitude, point.longitude);
        const tileId = this.tileProvider.getIdForTileCoords(initialTile);
        this.tileFrontier[tileId] = [initialTile, 0];
    }

    public async getIsochrone(maxCost: number, reset = true) {
        // TODO, make the cost a duration instead of a distance
        // TODO, properly support incremental isochrone computation
        const pathfinder = this.pathfinderProvider.getShortestPathTreeAlgorithm();

        // load more data as needed, depending on how far the previous iteration got
        for (const [_, tileData] of Object.entries(this.tileFrontier)) {
            const [tile, tileCost] = tileData;
            this.growFromTile(tile, maxCost - tileCost);
        }

        // wait for all data to arrive
        await this.tileProvider.wait();

        this.tileFrontier = {};

        let pathTree: IPathTree;
        pathfinder.setUseWeightedCost(false); // we want the raw durations
        if (reset) {
            pathTree = pathfinder.start(Geo.getId(this.startPoint), maxCost);
        } else {
            pathTree = pathfinder.continue(maxCost);
        }

        const result = [];
        for (const [id, cost] of Object.entries(pathTree)) {
            const node = this.registry.getNode(id);

            if (cost >= maxCost) {
                const reachedTile = toTileCoordinate(node.latitude, node.longitude);
                const tileId = this.tileProvider.getIdForTileCoords(reachedTile);

                if (!this.tileFrontier[tileId] || this.tileFrontier[tileId][1] > cost) {
                    // remember how fast we can reach every tile
                    // future calls can use this to determine which additional tiles are needed
                    this.tileFrontier[tileId] = [reachedTile, cost];
                }
            }
            result.push({ node, cost });
        }

        return visualizeIsochrone(this.registry, pathTree, maxCost);
    }

    private growFromTile(tileCoordinates: RoutableTileCoordinate, distance: number) {
        // use flood fill to determine which tiles are needed
        // slightly overkill, but conceptionally pretty simple
        const done = new Set();
        const queue = new Array();

        for (const neighbor of getNeighborTiles(tileCoordinates)) {
            queue.push(neighbor);
        }

        while (queue.length) {
            const candidate = queue.pop();

            const candidateId = this.tileProvider.getIdForTileCoords(candidate);
            if (!done.has(candidateId)) {
                done.add(candidateId);
                if (distance - getDistanceBetweenTiles(tileCoordinates, candidate) > 0) {
                    for (const neighbor of getNeighborTiles(candidate)) {
                        queue.push(neighbor);
                    }
                }
            }

            if (!this.reachedTiles.has(candidateId)) {
                this.tileProvider.getByTileCoords(candidate);
                this.reachedTiles.add(candidateId);
            }
        }
    }

    private async fetchInitialTiles(from: ILocation) {
        const zoom = 14;
        const padding = 0.02;

        const fromBBox = {
            top: from.latitude + padding,
            bottom: from.latitude - padding,
            left: from.longitude - padding,
            right: from.longitude + padding,
        };

        const fromTileCoords = inBBox.tilesInBbox(fromBBox, zoom).map((obj) => {
            const coordinate = new RoutableTileCoordinate(zoom, obj.x, obj.y);
            this.growFromTile(coordinate, 1000); // a bit of prefetching
            return coordinate;
        });

        // this 'get' won't do anything the prefetching hasn't already done
        // but we need the tile set to embed the starting location
        const fromTileset = await this.tileProvider.getMultipleByTileCoords(fromTileCoords);
        this.pathfinderProvider.embedLocation(from, fromTileset);
    }
}
