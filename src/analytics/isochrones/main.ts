import { Delaunay } from "d3-delaunay";
import "isomorphic-fetch";
import "reflect-metadata";
import inBBox from "tiles-in-bbox";
import Context from "../../Context";
import { RoutableTileCoordinate } from "../../entities/tiles/coordinate";
import { RoutableTileNode } from "../../entities/tiles/node";
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
            result.push({ node, cost });
        }

        this.createIsochrone(pathTree, maxCost);

        return result;
    }

    private createIsochrone(pathTree: IPathTree, maxCost: number) {
        const nodes = [];
        const costs = {};
        for (const [id, cost] of Object.entries(pathTree)) {
            const node = this.registry.getNode(id);
            if (node) {
                nodes.push(node);
                costs[node.id] = cost;
            }
        }

        const triangles = this.createTriangulation(nodes);
        const outerEdges = this.createOuterEdges(costs, maxCost, triangles);
        const rings = this.createOuterRings(outerEdges);

        const result = [];
        for (const ring of rings) {
            result.push(ring.map((nodeId) => this.registry.getNode(nodeId)));
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

    private createTriangulation(nodes: RoutableTileNode[]): RoutableTileNode[][] {
        function getX(p: ILocation) {
            return p.longitude;
        }

        function getY(p: ILocation) {
            return p.latitude;
        }

        const triangles = [];
        const { triangles: edges } = Delaunay.from(nodes, getX, getY);
        for (let i = 0; i < edges.length / 3; i++) {
            const firstIndex = edges[i * 3];
            const secondIndex = edges[i * 3 + 1];
            const thirdIndex = edges[i * 3 + 2];

            triangles.push([nodes[firstIndex], nodes[secondIndex], nodes[thirdIndex]]);
        }

        return triangles;
    }

    private createOuterEdges(costs, maxCost: number, triangles: RoutableTileNode[][]) {
        const result = {};

        function addOuterEdge(first, second) {
            if (result[first]) {
                result[first].push(second);
            } else {
                result[first] = [second];
            }

            if (result[second]) {
                result[second].push(first);
            } else {
                result[second] = [first];
            }
        }

        for (const triangle of triangles) {
            const [firstNode, secondNode, thirdNode] = triangle;

            const isFirstInternal = costs[firstNode.id] < maxCost;
            const isSecondInternal = costs[secondNode.id] < maxCost;
            const isThirdInternal = costs[thirdNode.id] < maxCost;

            if (isFirstInternal && isSecondInternal && !isThirdInternal) {
                addOuterEdge(firstNode.id, secondNode.id);
            } else if (isFirstInternal && !isSecondInternal && isThirdInternal) {
                addOuterEdge(firstNode.id, thirdNode.id);
            } else if (!isFirstInternal && isSecondInternal && isThirdInternal) {
                addOuterEdge(secondNode.id, thirdNode.id);
            }
        }

        return result;
    }

    private createOuterRings(outerEdges: object) {
        const todoNodeVisits = {};
        for (const [nodeId, edges] of Object.entries(outerEdges)) {
            todoNodeVisits[nodeId] = edges.length;
        }

        const rings = [];
        while (Object.keys(todoNodeVisits).length) {
            const currentRing = [];
            const firstNode = new Array(...Object.keys(todoNodeVisits))[0];

            currentRing.push(firstNode);
            todoNodeVisits[firstNode] -= 1;
            let currentNode = firstNode;

            while (currentRing.length === 1 || firstNode !== currentNode) {
                const lengthBefore = currentRing.length;
                const connectedNodes = outerEdges[currentNode];
                for (const otherNode of connectedNodes) {
                    if (todoNodeVisits[otherNode]) {
                        currentRing.push(otherNode);
                        todoNodeVisits[currentNode] -= 1;
                        todoNodeVisits[otherNode] -= 1;
                        if (todoNodeVisits[currentNode] < 1) {
                            delete todoNodeVisits[currentNode];
                        }
                        currentNode = otherNode;
                        break;
                    }
                }
                const lengthAfter = currentRing.length;
                if (lengthBefore === lengthAfter) {
                    console.log("stuck in a loop");
                    // stuck in a loop :(
                    break;
                }
            }

            rings.push(currentRing);
        }

        return rings;
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