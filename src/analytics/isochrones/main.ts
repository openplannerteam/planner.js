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
        const initialTile = this.toTileCoordinate(point.latitude, point.longitude);
        const tileId = this.tileProvider.getIdForTileCoords(initialTile);
        this.tileFrontier[tileId] = [initialTile, 0];
    }

    public async getIsochrone(maxCost: number, reset = false) {
        const pathfinder = this.pathfinderProvider.getShortestPathTreeAlgorithm();

        for (const [_, tileData] of Object.entries(this.tileFrontier)) {
            const [tile, tileCost] = tileData;
            this.growFromTile(tile, maxCost - tileCost);
        }

        await this.tileProvider.wait();

        this.tileFrontier = {};

        let pathTree: IPathTree;
        if (reset) {
            pathTree = pathfinder.start(Geo.getId(this.startPoint), maxCost);
        } else {
            pathTree = pathfinder.continue(maxCost);
        }

        const result = [];
        for (const [id, cost] of Object.entries(pathTree)) {
            const node = this.registry.getNode(id);
            result.push({node, cost});
        }

        return result;
    }

    private growFromTile(tileCoordinates: RoutableTileCoordinate, distance: number) {
        const done = new Set();
        const queue = new Array();

        for (const neighbor of this.getNeighbors(tileCoordinates)) {
            queue.push(neighbor);
        }

        while (queue.length) {
            const candidate = queue.pop();

            const candidateId = this.tileProvider.getIdForTileCoords(candidate);
            if (!done.has(candidateId)) {
                done.add(candidateId);
                if (distance - this.getDistanceBetween(tileCoordinates, candidate) > 0) {
                    for (const neighbor of this.getNeighbors(candidate)) {
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

        const fromTileset = await this.tileProvider.getMultipleByTileCoords(fromTileCoords);
        this.pathfinderProvider.embedLocation(from, fromTileset);
    }

    private getNeighbors(coordinate: RoutableTileCoordinate): RoutableTileCoordinate[] {
        const result = [];

        for (const xDelta of [-1, 0, 1]) {
            for (const yDelta of [-1, 0, 1]) {
                if (xDelta || yDelta) {
                    const neighbor = {
                        zoom: coordinate.zoom,
                        y: coordinate.y + yDelta,
                        x: coordinate.x + xDelta,
                    };
                    result.push(neighbor);
                }
            }
        }

        return result;
    }

    private getBoundingBox(coordinate: RoutableTileCoordinate): [ILocation, ILocation] {
        const top = this.tile_to_lat(coordinate);
        const left = this.tile_to_long(coordinate);

        const next = {
            zoom: coordinate.zoom,
            x: coordinate.x + 1,
            y: coordinate.y + 1,
        };

        const bottom = this.tile_to_lat(next);
        const right = this.tile_to_long(next);

        return [{ latitude: top, longitude: left }, { latitude: bottom, longitude: right }];
    }

    private getDistanceBetween(first: RoutableTileCoordinate, second: RoutableTileCoordinate) {
        const firstBox = this.getBoundingBox(first);
        const secondBox = this.getBoundingBox(second);

        const firstPoint = {
            latitude: (firstBox[0].latitude + firstBox[1].latitude) / 2,
            longitude: (firstBox[0].longitude + firstBox[1].longitude) / 2,
        };

        const secondPoint = {
            latitude: (secondBox[0].latitude + secondBox[1].latitude) / 2,
            longitude: (secondBox[0].longitude + secondBox[1].longitude) / 2,
        };

        return Geo.getDistanceBetweenLocations(firstPoint, secondPoint);
    }

    private long_to_tile(lon: number, zoom: number) {
        return Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
    }

    private lat_to_tile(lat: number, zoom: number) {
        return Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI)
            / 2 * Math.pow(2, zoom));
    }

    private toTileCoordinate(lat: number, long: number, zoom = 14): RoutableTileCoordinate {
        return {
            x: this.long_to_tile(long, zoom),
            y: this.lat_to_tile(lat, zoom),
            zoom,
        };
    }

    private tile_to_long(coordinate: RoutableTileCoordinate) {
        return (coordinate.x / Math.pow(2, coordinate.zoom) * 360 - 180);
    }

    private tile_to_lat(coordinate: RoutableTileCoordinate) {
        const n = Math.PI - 2 * Math.PI * coordinate.y / Math.pow(2, coordinate.zoom);
        return (180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
    }
}
