import { ArrayIterator, AsyncIterator } from "asynciterator";
import { inject, injectable } from "inversify";
import inBBox from "tiles-in-bbox";
import { RoutableTileCoordinate } from "../../entities/tiles/coordinate";
import { RoutableTileNode } from "../../entities/tiles/node";
import TravelMode from "../../enums/TravelMode";
import IRoutableTileProvider from "../../fetcher/tiles/IRoutableTileProvider";
import ILocation from "../../interfaces/ILocation";
import IPath from "../../interfaces/IPath";
import IProbabilisticValue from "../../interfaces/IProbabilisticValue";
import { DurationMs, SpeedKmH } from "../../interfaces/units";
import PathfinderProvider from "../../pathfinding/PathfinderProvider";
import IResolvedQuery from "../../query-runner/IResolvedQuery";
import TYPES from "../../types";
import Geo from "../../util/Geo";
import Units from "../../util/Units";
import Path from "../Path";
import IRoadPlanner from "./IRoadPlanner";

@injectable()
export default class RoadPlannerPathfinding implements IRoadPlanner {
    private tileProvider: IRoutableTileProvider;
    private pathfinderProvider: PathfinderProvider;

    constructor(
        @inject(TYPES.RoutableTileProvider) tileProvider: IRoutableTileProvider,
        @inject(TYPES.PathfinderProvider) pathfinderProvider: PathfinderProvider,
    ) {
        this.tileProvider = tileProvider;
        this.pathfinderProvider = pathfinderProvider;
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

        this.pathfinderProvider.embedLocation(from, fromTileset);
        this.pathfinderProvider.embedLocation(to, toTileset, true);

        return this._innerPath(from, to, minWalkingSpeed, maxWalkingSpeed);
    }

    private _innerPath(
        start: ILocation,
        stop: ILocation,
        minWalkingSpeed: SpeedKmH,
        maxWalkingSpeed: SpeedKmH,
    ): IPath {
        const pathfinder = this.pathfinderProvider.getShortestPathAlgorithm();
        const distance = pathfinder.queryDistance(Geo.getId(start), Geo.getId(stop));
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
}
