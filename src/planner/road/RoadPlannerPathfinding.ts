import { ArrayIterator, AsyncIterator } from "asynciterator";
import { inject, injectable } from "inversify";
import inBBox from "tiles-in-bbox";
import { RoutableTileCoordinate } from "../../entities/tiles/coordinate";
import TravelMode from "../../enums/TravelMode";
import IProfileProvider from "../../fetcher/profiles/IProfileProvider";
import IRoutableTileProvider from "../../fetcher/tiles/IRoutableTileProvider";
import ILocation from "../../interfaces/ILocation";
import IPath from "../../interfaces/IPath";
import IStep from "../../interfaces/IStep";
import PathfinderProvider from "../../pathfinding/PathfinderProvider";
import ILocationResolver from "../../query-runner/ILocationResolver";
import IResolvedQuery from "../../query-runner/IResolvedQuery";
import TYPES from "../../types";
import Geo from "../../util/Geo";
import Path from "../Path";
import IRoadPlanner from "./IRoadPlanner";

@injectable()
export default class RoadPlannerPathfinding implements IRoadPlanner {
    private tileProvider: IRoutableTileProvider;
    private pathfinderProvider: PathfinderProvider;
    private profileProvider: IProfileProvider;
    private locationResolver: ILocationResolver;

    constructor(
        @inject(TYPES.RoutableTileProvider) tileProvider: IRoutableTileProvider,
        @inject(TYPES.PathfinderProvider) pathfinderProvider: PathfinderProvider,
        @inject(TYPES.ProfileProvider) profileProvider: IProfileProvider,
        @inject(TYPES.LocationResolver) locationResolver: ILocationResolver,
    ) {
        this.tileProvider = tileProvider;
        this.pathfinderProvider = pathfinderProvider;
        this.profileProvider = profileProvider;
        this.locationResolver = locationResolver;
    }

    public async plan(query: IResolvedQuery): Promise<AsyncIterator<IPath>> {
        const {
            from: fromLocations,
            to: toLocations,
        } = query;

        const paths = [];

        if (fromLocations && toLocations && fromLocations.length && toLocations.length) {

            for (const from of fromLocations) {
                for (const to of toLocations) {

                    const newPath = await this.getPathBetweenLocations(
                        from,
                        to,
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

        await Promise.all([
            this.pathfinderProvider.embedLocation(from, fromTileset),
            this.pathfinderProvider.embedLocation(to, toTileset, true),
        ]);

        return this._innerPath(from, to);
    }

    private async _innerPath(
        start: ILocation,
        stop: ILocation,
    ): Promise<IPath> {
        const pathfinder = await this.pathfinderProvider.getShortestPathAlgorithm();
        const summary = pathfinder.queryPath(Geo.getId(start), Geo.getId(stop));

        const steps: IStep[] = [];
        for (const step of summary) {
            const to = await this.locationResolver.resolve(step.to);
            const from = await this.locationResolver.resolve(step.from);
            steps.push({
                startLocation: from,
                stopLocation: to,
                duration: { average: step.duration },
                distance: step.distance,
                travelMode: TravelMode.Profile,
            });
        }

        return new Path(steps);
    }
}
