import { ArrayIterator, AsyncIterator } from "asynciterator";
import { inject, injectable } from "inversify";
import inBBox from "tiles-in-bbox";
import Context from "../../Context";
import { RoutableTileCoordinate } from "../../entities/tiles/coordinate";
import { RoutableTileNode } from "../../entities/tiles/node";
import { RoutableTileSet } from "../../entities/tiles/set";
import TravelMode from "../../enums/TravelMode";
import IRoutableTileProvider from "../../fetcher/tiles/IRoutableTileProvider";
import ILocation from "../../interfaces/ILocation";
import IPath from "../../interfaces/IPath";
import IProbabilisticValue from "../../interfaces/IProbabilisticValue";
import IStep from "../../interfaces/IStep";
import { DurationMs, SpeedKmH } from "../../interfaces/units";
import { IPathfinder } from "../../pathfinding/pathfinder";
import IResolvedQuery from "../../query-runner/IResolvedQuery";
import TYPES from "../../types";
import Geo from "../../util/Geo";
import Units from "../../util/Units";
import Path from "../Path";
import IRoadPlanner from "./IRoadPlanner";

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

        let paths = [];

        if (fromLocations && toLocations && fromLocations.length && toLocations.length) {

            for (const from of fromLocations) {
                for (const to of toLocations) {

                    const newPaths = await this.getPathBetweenLocations(
                        from,
                        to,
                        minimumWalkingSpeed,
                        maximumWalkingSpeed,
                    );

                    if (newPaths) {
                        paths = paths.concat(newPaths);
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
    ): Promise<IPath[]> {
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

        const fromPaths = this.embedLocation(from, fromTileset, minWalkingSpeed, maxWalkingSpeed);
        const toPaths = this.embedLocation(to, toTileset, minWalkingSpeed, maxWalkingSpeed, true);

        const result: IPath[] = [];
        for (const fromPath of fromPaths) {
            for (const toPath of toPaths) {
                const node1 = fromPath.steps[fromPath.steps.length - 1].stopLocation as RoutableTileNode;
                const node2 = toPath.steps[toPath.steps.length - 2].startLocation as RoutableTileNode;
                const path = this._innerPath(node1, node2, minWalkingSpeed, maxWalkingSpeed);
                if (path && path.steps.length) {
                    let totalPath = fromPath.steps.concat(path.steps);
                    totalPath = totalPath.concat(toPath.steps);
                    result.push({steps: totalPath});
                }
            }
        }
        return result;
    }

    private _innerPath(
        start: RoutableTileNode,
        stop: RoutableTileNode,
        minWalkingSpeed: SpeedKmH,
        maxWalkingSpeed: SpeedKmH,
    ): IPath {
        const distance = this.pathfinder.queryDistance(start.id, stop.id);
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

    private createStep(from, to, distance, minSpeed, maxSpeed): IStep {
        const minDuration = Units.toDuration(distance, maxSpeed);
        const maxDuration = Units.toDuration(distance, minSpeed);

        const duration: IProbabilisticValue<DurationMs> = {
            minimum: minDuration,
            maximum: maxDuration,
            average: (minDuration + maxDuration) / 2,
        };

        return {
            startLocation: from,
            stopLocation: to,
            distance,
            duration,
            travelMode: TravelMode.Walking,
        };

    }

    private embedLocation(p: ILocation, tileset: RoutableTileSet, minSpeed, maxSpeed, invert = false): IPath[] {
        let bestDistance = Infinity;
        let paths: IPath[];

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

                        if (invert) {
                            const intersectionStep = this.createStep(intersection, p, distance, minSpeed, maxSpeed);

                            const stepA = this.createStep(from,
                                intersection,
                                Geo.getDistanceBetweenLocations(intersection, from),
                                minSpeed, maxSpeed);
                            const stepB = this.createStep(to,
                                intersection,
                                Geo.getDistanceBetweenLocations(intersection, from),
                                minSpeed, maxSpeed);

                            paths = [
                                { steps: [stepA, intersectionStep] },
                                { steps: [stepB, intersectionStep] },
                            ];
                        } else {
                            const intersectionStep = this.createStep(p, intersection, distance, minSpeed, maxSpeed);

                            const stepA = this.createStep(intersection,
                                from,
                                Geo.getDistanceBetweenLocations(intersection, from),
                                minSpeed, maxSpeed);
                            const stepB = this.createStep(intersection,
                                to,
                                Geo.getDistanceBetweenLocations(intersection, from),
                                minSpeed, maxSpeed);

                            paths = [
                                { steps: [intersectionStep, stepA] },
                                { steps: [intersectionStep, stepB] },
                            ];
                        }
                    }
                }
            }
        }

        return paths;
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
