import { ArrayIterator, AsyncIterator } from "asynciterator";
import { EventEmitter } from "events";
import { inject, injectable, tagged } from "inversify";
import Profile from "../../entities/profile/Profile";
import { RoutableTileCoordinate } from "../../entities/tiles/coordinate";
import { RoutableTileNode } from "../../entities/tiles/node";
import RoutableTileRegistry from "../../entities/tiles/registry";
import { RoutableTile, TransitTile } from "../../entities/tiles/tile";
import RoutingPhase from "../../enums/RoutingPhase";
import TravelMode from "../../enums/TravelMode";
import EventBus from "../../events/EventBus";
import EventType from "../../events/EventType";
import IProfileProvider from "../../fetcher/profiles/IProfileProvider";
import IRoutableTileProvider from "../../fetcher/tiles/IRoutableTileProvider";
import ISmartTileProvider from "../../fetcher/tiles/ISmartTileProvider";
import ILocation from "../../interfaces/ILocation";
import IPath from "../../interfaces/IPath";
import IStep from "../../interfaces/IStep";
import PathfinderProvider from "../../pathfinding/PathfinderProvider";
import ILocationResolver from "../../query-runner/ILocationResolver";
import IResolvedQuery from "../../query-runner/IResolvedQuery";
import TYPES from "../../types";
import Geo from "../../util/Geo";
import { toTileCoordinate } from "../../util/Tiles";
import Leg from "../Leg";
import Path from "../Path";
import IRoadPlanner from "./IRoadPlanner";
import { RoutableTileSet } from "../../entities/tiles/set";

@injectable()
export default class RoadPlannerPathfindingExperimental implements IRoadPlanner {
    private smartTileProvider: ISmartTileProvider;
    private pathfinderProvider: PathfinderProvider;
    private profileProvider: IProfileProvider;
    private locationResolver: ILocationResolver;
    private registry: RoutableTileRegistry;
    private eventBus: EventEmitter;

    // STATEFUL!
    // will misbehave when processing several queries concurrently
    private reachedTiles: Set<string>;
    private localNodes: ILocation[];

    constructor(
        @inject(TYPES.SmartTileProvider)
        smartTileProvider: ISmartTileProvider,
        @inject(TYPES.PathfinderProvider) pathfinderProvider: PathfinderProvider,
        @inject(TYPES.ProfileProvider) profileProvider: IProfileProvider,
        @inject(TYPES.LocationResolver) locationResolver: ILocationResolver,
    ) {
        this.smartTileProvider = smartTileProvider;
        this.pathfinderProvider = pathfinderProvider;
        this.profileProvider = profileProvider;
        this.locationResolver = locationResolver;
        this.registry = RoutableTileRegistry.getInstance();
        this.eventBus = EventBus.getInstance();
        this.reachedTiles = new Set();
    }

    public async plan(query: IResolvedQuery, catalogUrl: string): Promise<AsyncIterator<IPath>> {
        const {
            from: fromLocations,
            to: toLocations,
            profileID,
        } = query;

        const paths = [];
        const profile = await this.profileProvider.getProfile(profileID);
        await this.smartTileProvider.selectDataSources(catalogUrl, profileID);

        if (fromLocations && toLocations && fromLocations.length && toLocations.length) {

            for (const from of fromLocations) {
                for (const to of toLocations) {

                    const newPath = await this.getPathBetweenLocations(
                        from,
                        to,
                        profile,
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
        profile: Profile,
    ): Promise<IPath> {
        this.localNodes = [from, to];
        this.smartTileProvider.addLocalNodes(this.localNodes)


        await Promise.all([
            this.embedLocation(from),
            this.embedLocation(to, true),
        ]);

        return this._innerPath(from, to, profile);
    }

    private async _innerPath(
        start: ILocation,
        stop: ILocation,
        profile: Profile,
    ): Promise<IPath> {
        const pathfinder = await this.pathfinderProvider.getShortestPathAlgorithm(profile);
        const maxDistance = Geo.getDistanceBetweenLocations(start, stop) * 5;
        const path = await pathfinder.queryPath(Geo.getId(start), Geo.getId(stop), maxDistance);

        const steps: IStep[] = [];
        for (const step of path) {
            const to = await this.locationResolver.resolve(step.to);
            const from = await this.locationResolver.resolve(step.from);
            steps.push({
                startLocation: from,
                stopLocation: to,
                duration: { average: step.duration },
                distance: step.distance,
            });
        }

        const leg = new Leg(TravelMode.Profile, steps);
        return new Path([leg]);
    }

    private async fetchTile(node: RoutableTileNode) {
        let local = false;
        let baseTileId: string;
        let transitTileId: string;

        for (const localNode of this.localNodes) {
            if (node.latitude === localNode.latitude && node.longitude === localNode.longitude) {
                local = true;
                break;
            }
        }

        if (local) {
            baseTileId = await this.smartTileProvider.traverseRoutableTree(node);
        }
        else {
            transitTileId = await this.smartTileProvider.traverseTransitTree(node);
        }

        if ((local || !this.reachedTiles.has(transitTileId)) && (!local || !this.reachedTiles.has(baseTileId))) {
            this.eventBus.emit(EventType.ReachableTile, node);
            let tile: RoutableTile;
            let tTile: TransitTile;

            const boundaryNodes: Set<string> = new Set();

            if (local) {
                tile = await this.smartTileProvider.getRTByUrl(baseTileId);
                this.reachedTiles.add(baseTileId);

                for (const nodeId of tile.getNodes()) {
                    const node = this.registry.getNode(nodeId);
                    if (!tile.containsGeoValue(node)) {
                        boundaryNodes.add(nodeId);
                    }
                }

            } else {
                tTile = await this.smartTileProvider.getByUrl(transitTileId);
                this.reachedTiles.add(transitTileId);

                for (const nodeId of tTile.getNodes()) {
                    const node = this.registry.getNode(nodeId);
                    if (!tTile.containsGeoValue(node)) {
                        boundaryNodes.add(nodeId);
                    }
                }
            }

            const self = this;
            for (const profile of await this.profileProvider.getProfiles()) {
                const graph = this.pathfinderProvider.getGraphForProfile(profile);

                for (const nodeId of boundaryNodes) {
                    graph.setBreakPoint(nodeId, async (on: string) => {
                        const node = self.registry.getNode(on);
                        await self.fetchTile(node);
                    });
                }
            }
        }
    }

    private async embedLocation(from: ILocation, invert = false) {
        const zoom = 14;
        const padding = 0.005;

        let corner1 = new RoutableTileNode();
        let corner2 = new RoutableTileNode();
        let corner3 = new RoutableTileNode();
        let corner4 = new RoutableTileNode();

        corner1.latitude = from.latitude + padding;
        corner1.longitude = from.longitude - padding;

        corner2.latitude = from.latitude + padding;
        corner2.longitude = from.longitude + padding;

        corner3.latitude = from.latitude - padding;
        corner3.longitude = from.longitude + padding;

        corner4.latitude = from.latitude - padding;
        corner4.longitude = from.longitude - padding;

        let fromNodes = new Set<ILocation>();
        fromNodes.add(corner1);
        fromNodes.add(corner2);
        fromNodes.add(corner3);
        fromNodes.add(corner4);
        fromNodes.add(from);

        let fromTiles: RoutableTile[] = [];

        for (const n of fromNodes) {
            let rtNode = new RoutableTileNode();
            rtNode.longitude = n.longitude;
            rtNode.latitude = n.latitude;
            this.localNodes.push(rtNode);
            await this.fetchTile(rtNode);
            const fromTile: RoutableTile = await this.smartTileProvider.fetchCorrectTile(rtNode, true);
            fromTiles.push(fromTile);
        }

        const fromTileset = new RoutableTileSet(fromTiles);

        // this won't download anything new
        // but we need the tile data to embed the starting location
        await this.pathfinderProvider.embedLocation(from, fromTileset, invert);
    }
}
