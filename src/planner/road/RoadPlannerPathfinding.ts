import { ArrayIterator, AsyncIterator } from "asynciterator";
import { EventEmitter } from "events";
import { inject, injectable, tagged } from "inversify";
import inBBox from "tiles-in-bbox";
import Profile from "../../entities/profile/Profile";
import RoutableTileRegistry from "../../entities/tiles/RoutableTileRegistry";
import TileCoordinate from "../../entities/tiles/TileCoordinate";
import RoutingPhase from "../../enums/RoutingPhase";
import TravelMode from "../../enums/TravelMode";
import EventBus from "../../events/EventBus";
import EventType from "../../events/EventType";
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
import { toTileCoordinate } from "../../util/Tiles";
import Leg from "../Leg";
import Path from "../Path";
import IRoadPlanner from "./IRoadPlanner";

/*
      ,-----------.          ,------------------.
      |RoadPlanner|          |PathfinderProvider|
      `-----+-----'          `--------+---------'
 plan(query)|                         |
 ----------->                         |
            |                         |
   ,-----------------!.               |
   |See other diagram|_\              |
   `-------------------'              |
            |----.                    |
            |    | fetchTile          |
            |<---'                    |
            |                         |
            |    ,------------------------------------------!.
            |    |Connect begin/end location to road network|_\
            |    `--------------------------------------------'
            |      embedLocation      |
            | ------------------------>
            |                         |
            |                         |              ,-------------------------------!.
            |                         |              |Contains the pathfinding state,|_\
            |                         |              |which is query-specific          |
            |                         |              `---------------------------------'
            |                  queryPath                   ,--------------------.
            | -------------------------------------------->|ShortestPathInstance|
            |                         |                    `--------------------'
            |                         |
*/

/*
         ,-----------.          ,--------------------.                          ,------------------.
         |RoadPlanner|          |RoutableTileProvider|                          |PathfinderProvider|
         `-----+-----'          `---------+----------'                          `--------+---------'
   fetchTile   |                          |                                              |
 ------------->|                          |                                              |
               |                          |                                              |
               |           get            |                                              |
               |------------------------->|                                              |
               |                          |                                              |
               |                          |         ,--------------------------!.        |
               |                          |         |Boundary nodes lie outside|_\       |
               |                          |         |the tile's bounding box     |       |
               |                          |         `----------------------------'       |
               |              get_boundary_nodes                ,----.                   |
               |----------------------------------------------> |Tile|                   |
               |                          |                     `----'                   |
  ,------------------------!.             |                       |                      |
  |Call this function again|_\            |                       |                      |
  |when pathfinding reaches  |            |                       |                      |
  |a boundary node           |            |                       |                      |
  `--------------------------'            |                       |                      |
               |             add_breakpoint(boundary_node, this.fetchTile)               |
               |------------------------------------------------------------------------>|
               |                          |                       |                      |
               |                          |                       |                      |
*/

@injectable()
export default class RoadPlannerPathfinding implements IRoadPlanner {
    private tileProvider: IRoutableTileProvider;
    private pathfinderProvider: PathfinderProvider;
    private profileProvider: IProfileProvider;
    private locationResolver: ILocationResolver;
    private registry: RoutableTileRegistry;
    private eventBus: EventEmitter;

    private reachedTiles: Set<string>;

    constructor(
        @inject(TYPES.RoutableTileProvider)
        @tagged("phase", RoutingPhase.Base)
        tileProvider: IRoutableTileProvider,
        @inject(TYPES.PathfinderProvider) pathfinderProvider: PathfinderProvider,
        @inject(TYPES.ProfileProvider) profileProvider: IProfileProvider,
        @inject(TYPES.LocationResolver) locationResolver: ILocationResolver,
    ) {
        this.tileProvider = tileProvider;
        this.pathfinderProvider = pathfinderProvider;
        this.profileProvider = profileProvider;
        this.locationResolver = locationResolver;
        this.registry = RoutableTileRegistry.getInstance();
        this.eventBus = EventBus.getInstance();
        this.reachedTiles = new Set();
    }

    public async plan(query: IResolvedQuery): Promise<AsyncIterator<IPath>> {
        const {
            from: fromLocations,
            to: toLocations,
            profileID,
        } = query;

        const paths = [];
        const profile = await this.profileProvider.getProfile(profileID);

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
        const maxDistance = Geo.getDistanceBetweenLocations(start, stop) * 10 + 1000;
        const path = await pathfinder.queryPath(Geo.getId(start), Geo.getId(stop), maxDistance);

        const steps: IStep[] = [];
        const context = {};
        for (const step of path) {
            const to = await this.locationResolver.resolve(step.to);
            const from = await this.locationResolver.resolve(step.from);
            steps.push({
                startLocation: from,
                stopLocation: to,
                through: step.through,
                duration: { average: step.duration },
                distance: step.distance,
            });

            if (step.through) {
                context[step.through] = this.registry.getWay(step.through);
            }
        }

        const leg = new Leg(TravelMode.Profile, steps);
        return new Path([leg], context);
    }

    private async fetchTile(coordinate: TileCoordinate) {
        const tileId = this.tileProvider.getIdForTileCoords(coordinate);
        if (!this.reachedTiles.has(tileId)) {
            const tile = await this.tileProvider.getByTileCoords(coordinate);
            this.eventBus.emit(EventType.ReachableTile, coordinate);
            this.reachedTiles.add(tileId);
            const boundaryNodes: Set<string> = new Set();

            for (const nodeId of tile.getNodes()) {
                const node = this.registry.getNode(nodeId);
                if (!tile.contains(node)) {
                    boundaryNodes.add(nodeId);
                }
            }

            const self = this;
            for (const profile of await this.profileProvider.getProfiles()) {
                const pathfinder = this.pathfinderProvider.getShortestPathAlgorithm(profile);

                for (const nodeId of boundaryNodes) {
                    pathfinder.setBreakPoint(nodeId, async (on: string) => {
                        const node = self.registry.getNode(on);
                        const boundaryTileCoordinate = toTileCoordinate(node.latitude, node.longitude);
                        await self.fetchTile(boundaryTileCoordinate);
                    });
                }
            }
        }
    }

    private async embedLocation(from: ILocation, invert = false) {
        const zoom = 14;
        const padding = 0.005;

        const fromBBox = {
            top: from.latitude + padding,
            bottom: from.latitude - padding,
            left: from.longitude - padding,
            right: from.longitude + padding,
        };

        const fromTileCoords = inBBox.tilesInBbox(fromBBox, zoom).map((obj) => {
            const coordinate = new TileCoordinate(zoom, obj.x, obj.y);
            this.fetchTile(coordinate);
            return coordinate;
        });

        // this won't download anything new
        // but we need the tile data to embed the starting location
        const fromTileset = await this.tileProvider.getMultipleByTileCoords(fromTileCoords);
        await this.pathfinderProvider.embedLocation(from, fromTileset, invert);
    }
}
