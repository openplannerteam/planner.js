import { ArrayIterator, AsyncIterator } from "asynciterator";
import { inject, injectable } from "inversify";
import inBBox from "tiles-in-bbox";
import { RoutableTileCoordinate } from "../../entities/tiles/coordinate";
import { RoutableTileNode } from "../../entities/tiles/node";
import { RoutableTileSet } from "../../entities/tiles/set";
import TravelMode from "../../enums/TravelMode";
import IRoutableTileProvider from "../../fetcher/tiles/IRoutableTileProvider";
import ILocation from "../../interfaces/ILocation";
import IPath from "../../interfaces/IPath";
import IProbabilisticValue from "../../interfaces/IProbabilisticValue";
import { DurationMs, SpeedKmH } from "../../interfaces/units";
import { IPathfinder } from "../../pathfinding/pathfinder";
import IResolvedQuery from "../../query-runner/IResolvedQuery";
import TYPES from "../../types";
import Geo from "../../util/Geo";
import Units from "../../util/Units";
import Path from "../Path";
import IRoadPlanner from "./IRoadPlanner";

interface IPointEmbedding {
    point: ILocation; // point that's embedded into the road network
    intersection: ILocation; // closest point on the road segment closest to the point
    segA: RoutableTileNode; // one side of the road segment closest to the point
    segB: RoutableTileNode; // other side of the road segment closest to the point
}

@injectable()
export default class RoadPlannerPathfinding implements IRoadPlanner {
    private tileProvider: IRoutableTileProvider;
    private pathfinder: IPathfinder;

    constructor(
        @inject(TYPES.RoutableTileProvider) tileProvider: IRoutableTileProvider,
        @inject(TYPES.Pathfinder) pathfinder: IPathfinder,
    ) {
        this.tileProvider = tileProvider;
        this.pathfinder = pathfinder;
    }

    public async plan(query: IResolvedQuery): Promise<AsyncIterator<IPath>> {
        const {
            from: fromLocations,
            to: toLocations,
            minimumWalkingSpeed,
            maximumWalkingSpeed,
        } = query;

        const paths = [];

        if (fromLocations && toLocations && fromLocations.length && toLocations.length) {

            for (const from of fromLocations) {
                for (const to of toLocations) {

                    const newPath = await this.getPathBetweenLocations(
                        from,
                        to,
                        minimumWalkingSpeed,
                        maximumWalkingSpeed,
                    );

                    if (newPath) {
                        paths.push(newPath);
                    }
                }
            }
        }

        return new ArrayIterator<IPath>(paths);
    }

    private async getPathBetweenLocations(
        from: ILocation,
        to: ILocation,
        minWalkingSpeed: SpeedKmH,
        maxWalkingSpeed: SpeedKmH,
    ): Promise<IPath> {
        const padding = 0.02;
        const zoom = 14;

        const fromBBox = {
            top: from.latitude + padding,
            bottom: from.latitude - padding,
            left: from.longitude - padding,
            right: from.longitude + padding,
        };
        const toBBox = {
            top: to.latitude + padding,
            bottom: to.latitude - padding,
            left: to.longitude - padding,
            right: to.longitude + padding,
        };
        const betweenBBox = {
            top: Math.max(fromBBox.top, toBBox.top),
            bottom: Math.min(fromBBox.bottom, toBBox.bottom),
            left: Math.min(fromBBox.left, toBBox.left),
            right: Math.max(fromBBox.right, toBBox.right),
        };

        const fromTileCoords = inBBox.tilesInBbox(fromBBox, zoom).map((obj) => {
            return new RoutableTileCoordinate(zoom, obj.x, obj.y);
        });
        const toTileCoords = inBBox.tilesInBbox(toBBox, zoom).map((obj) => {
            return new RoutableTileCoordinate(zoom, obj.x, obj.y);
        });
        const betweenTileCoords = inBBox.tilesInBbox(betweenBBox, zoom).map((obj) => {
            return new RoutableTileCoordinate(zoom, obj.x, obj.y);
        });

        const [fromTileset, toTileset, _] = await Promise.all([
            this.tileProvider.getMultipleByTileCoords(fromTileCoords),
            this.tileProvider.getMultipleByTileCoords(toTileCoords),
            this.tileProvider.getMultipleByTileCoords(betweenTileCoords)]);

        this.embedLocation(from, fromTileset);
        this.embedLocation(to, toTileset, true);

        return this._innerPath(from, to, minWalkingSpeed, maxWalkingSpeed);
    }

    private _innerPath(
        start: ILocation,
        stop: ILocation,
        minWalkingSpeed: SpeedKmH,
        maxWalkingSpeed: SpeedKmH,
    ): IPath {
        const distance = this.pathfinder.queryDistance(Geo.getId(start), Geo.getId(stop));
        const minDuration = Units.toDuration(distance, maxWalkingSpeed);
        const maxDuration = Units.toDuration(distance, minWalkingSpeed);

        const duration: IProbabilisticValue<DurationMs> = {
            minimum: minDuration,
            maximum: maxDuration,
            average: (minDuration + maxDuration) / 2,
        };

        return new Path([{
            startLocation: start,
            stopLocation: stop,
            distance,
            duration,
            travelMode: TravelMode.Walking,
        }]);
    }

    private embedLocation(p: ILocation, tileset: RoutableTileSet, invert = false) {
        let bestDistance = Infinity;
        let bestEmbedding: IPointEmbedding;

        for (const way of Object.values(tileset.getWays())) {
            if (way.reachable === false) {
                continue;
            }

            for (const segment of way.segments) {
                for (let i = 0; i < segment.length - 1; i++) {
                    const nodeA = segment[i];
                    const from = tileset.getNodes()[nodeA];
                    const nodeB = segment[i + 1];
                    const to = tileset.getNodes()[nodeB];

                    if (!from || !to) {
                        // FIXME, caused by bug in data
                        continue;
                    }

                    const [distance, intersection] = this.segmentDistToPoint(from, to, p);
                    if (distance < bestDistance) {
                        bestDistance = distance;
                        bestEmbedding = {
                            point: p,
                            segA: from,
                            segB: to,
                            intersection,
                        };
                    }
                }
            }
        }

        if (bestEmbedding) {
            const intersection = bestEmbedding.intersection;
            const segA = bestEmbedding.segA;
            const segB = bestEmbedding.segB;

            const pointId = Geo.getId(bestEmbedding.point);
            const intersectionId = Geo.getId(bestEmbedding.intersection);

            if (!invert) {
                // todo, account for one-direction streets
                this.pathfinder.addEdge(pointId, intersectionId, bestDistance);
                this.pathfinder.addEdge(intersectionId, segA.id, Geo.getDistanceBetweenLocations(intersection, segA));
                this.pathfinder.addEdge(intersectionId, segB.id, Geo.getDistanceBetweenLocations(intersection, segB));
            } else {
                this.pathfinder.addEdge(intersectionId, pointId, bestDistance);
                this.pathfinder.addEdge(segA.id, intersectionId, Geo.getDistanceBetweenLocations(intersection, segA));
                this.pathfinder.addEdge(segB.id, intersectionId, Geo.getDistanceBetweenLocations(intersection, segB));
            }
        }
    }

    private segmentDistToPoint(segA: ILocation, segB: ILocation, p: ILocation): [number, ILocation] {
        // seems numerically unstable, see 'catastrophic cancellation'
        const sx1 = segA.longitude;
        const sx2 = segB.longitude;
        const px = p.longitude;

        const sy1 = segA.latitude;
        const sy2 = segB.latitude;
        const py = p.latitude;

        const px2 = sx2 - sx1;
        const py2 = sy2 - sy2;

        const norm = px2 * px2 + py2 * py2;
        let u = ((px - sx1) * px2 + (py - sy1) * py2) / norm;

        if (u > 1) {
            u = 1;
        } else if (u < 0) {
            u = 0;
        }

        const x = sx1 + u * px2;
        const y = sy1 + u * py2;

        const intersection = {
            longitude: x,
            latitude: y,
        };

        const dist = Geo.getDistanceBetweenLocations(p, intersection);

        return [dist, intersection];
    }
}
