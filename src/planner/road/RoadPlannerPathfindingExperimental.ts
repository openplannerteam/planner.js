import { ArrayIterator, AsyncIterator } from "asynciterator";
import { EventEmitter } from "events";
import { inject, injectable, tagged } from "inversify";
import inBBox from "tiles-in-bbox";
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
import SmartTileProvider from "../../fetcher/tiles/SmartTileProvider";
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
    private baseTileProvider: IRoutableTileProvider;
    //private transitTileProvider: IRoutableTileProvider;
    private smartTileProvider: ISmartTileProvider;
    private pathfinderProvider: PathfinderProvider;
    private profileProvider: IProfileProvider;
    private locationResolver: ILocationResolver;
    private registry: RoutableTileRegistry;
    private eventBus: EventEmitter;

    // STATEFUL!
    // will misbehave when processing several queries concurrently
    private reachedTiles: Set<string>;
    private localTiles: RoutableTileCoordinate[];
    private localNodes: ILocation[];

    constructor(
        @inject(TYPES.RoutableTileProvider)
        @tagged("phase", RoutingPhase.Base)
        baseTileProvider: IRoutableTileProvider,
        //@inject(TYPES.RoutableTileProvider)
        // @tagged("phase", RoutingPhase.Transit)
        // transitTileProvider: IRoutableTileProvider,
        @inject(TYPES.SmartTileProvider)
        smartTileProvider: ISmartTileProvider,
        @inject(TYPES.PathfinderProvider) pathfinderProvider: PathfinderProvider,
        @inject(TYPES.ProfileProvider) profileProvider: IProfileProvider,
        @inject(TYPES.LocationResolver) locationResolver: ILocationResolver,
    ) {
        this.baseTileProvider = baseTileProvider;
        this.smartTileProvider = smartTileProvider;
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

    //krijgt een van-locatie en een naar-locatie mee en een profile, geeft een path terug uiteindelijk
    //een path bestaat uit legs die uit steps bestaan, een step is het kleinste deel en gaat van een location naar een location
    private async getPathBetweenLocations(
        from: ILocation,
        to: ILocation,
        profile: Profile,
    ): Promise<IPath> {

        //de tilecoordinaten van start en eindpunt worden in localtiles gestoken
        this.localTiles = [
            toTileCoordinate(from.latitude, from.longitude),
            toTileCoordinate(to.latitude, to.longitude),
        ];

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

    //het start van vanboven en geeft de eerst mogelijke tile terug die niet start of eindtile bevat
    // private pickTile(node: RoutableTileNode) {
    //     let coordinate: RoutableTileCoordinate;
    //     for (let zoom = 8; zoom < 15; zoom++) {
    //         coordinate = toTileCoordinate(node.latitude, node.longitude, zoom);
    //         let ok = true;
    //         for (const localTile of this.localTiles) {
    //             if (coordinate.contains(localTile)) {
    //                 ok = false;
    //                 break;
    //             }
    //         }
    //         if (ok) {
    //             return coordinate;
    //         }
    //     }
    //     return coordinate;
    // }

    //boom structuur alternatief voor pickTile
    // private async traverseTransitTree(node: RoutableTileNode) {
    //     let tile: TransitTile;
    //     const rootUrl = "http://192.168.56.1:8080/transitTree/root";

    //     tile = await this.transitTileProvider.getByUrl(rootUrl);

    //     while (tile.getArea().contains(this.localNodes[0]) || tile.getArea().contains(this.localNodes[1])) {
    //         //als je op laagste niveau bent, breek uit de while loop
    //         if (tile.coordinate.zoom === 14) {
    //             break; //hier zou je ook een check kunnen doen op zit er 1 van de 2 in, zoja geef link naar de routableTile
    //         }

    //         //alternatief voor if zoomlevel == 14 want op dat level zullen er geen 4 kinderen meer inzitten
    //         if (tile.getRelations().size != 4) {
    //             break;
    //         }

    //         for (const rel of tile.getRelations()) {
    //             if (rel.geoValue.contains(node)) {
    //                 tile = await this.transitTileProvider.getByUrl(rel.id);
    //             }
    //         }
    //     }
    //     //dan krijg je hier de grootst mogelijke tile die wel de node bevat maar niet het start- of eindpunt bevat
    //     return tile.coordinate;
    // }



    // private async customFetchTile(coordinate: RoutableTileCoordinate){
    //     let local = false;

    //     for(const localTile of this.localTiles){
    //         if(coordinate.x === localTile.x && coordinate.y == localTile.y && coordinate.zoom === localTile.zoom){
    //             local = true;
    //             break;
    //         }
    //     }

    //     //dit maakt de URL aan waarmee je de tiles zou kunnen fetchen, en is eigenlijk ook gewoon de ID van een tile
    //     const baseTileId = this.baseTileProvider.getIdForTileCoords(coordinate);
    //     const transitTileId = this.transitTileProvider.getIdForTileCoords(coordinate);

    //     if(!this.reachedTiles.has(baseTileId) && !this.reachedTiles.has(transitTileId)){
    //         let tile: RoutableTile;
    //         let transitTile: TransitTile;

    //         if(local){
    //             tile = await this.baseTileProvider.getByTileCoords(coordinate);
    //             this.reachedTiles.add(baseTileId);
    //         }

    //         const boundaryNodes: Set<string> = new Set();

    //         if(tile){
    //             for(const nodeId of tile.getNodes()){
    //                 const node = this.registry.getNode(nodeId);
    //             }
    //         }

    //     }

    // }

    private async fetchTile(node: RoutableTileNode) {
        let local = false;

        for (const localNode of this.localNodes) {
            if (node.latitude === localNode.latitude && node.longitude === localNode.longitude) {
                local = true;
                break;
            }
        }

        //hier wordt de accessURL gegenereerd waarmee je eventueel de tiles zou kunnen fetchen
        let baseTile : RoutableTile;
        if(local == true){
            baseTile = await this.smartTileProvider.fetchCorrectTile(node, true);
        }
            const transitTile = await this.smartTileProvider.fetchCorrectTile(node);

        if (!this.reachedTiles.has(transitTile.id) && !this.reachedTiles.has(baseTile.id)) {
            this.eventBus.emit(EventType.ReachableTile, node);
            let tile: RoutableTile;
            let tTile: TransitTile;

            if (local) {
                tile = await this.smartTileProvider.fetchCorrectTile(node, true);
                this.reachedTiles.add(baseTile.id);
                this.reachedTiles.add(transitTile.id);
                console.log(baseTile.id);
                console.log(transitTile.id);
            } else {
                tTile = await this.smartTileProvider.fetchCorrectTile(node);
                this.reachedTiles.add(transitTile.id);
                console.log(transitTile.id);
            }

            const boundaryNodes: Set<string> = new Set();

            if (tile) {
                for (const nodeId of tile.getNodes()) {
                    const node = this.registry.getNode(nodeId);
                    if (!tile.contains(node)) {
                        boundaryNodes.add(nodeId);
                    }
                }
            }
            if (tTile) {
                for (const nodeId of tTile.getNodes()) {
                    const node = this.registry.getNode(nodeId);
                    if (!tTile.contains(node)) {
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
    //je begint op random coordinaaat en wil dat embedden in OSM, de hij zoekt dichtsbijzijnde straat bij dat punt en dan het dichtste punt
    private async embedLocation(from: ILocation, invert = false) {
        const zoom = 14;
        const padding = 0.005;

        // const fromBBox = {
        //     top: from.latitude + padding,
        //     bottom: from.latitude - padding,
        //     left: from.longitude - padding,
        //     right: from.longitude + padding,
        // };

        //hacky solution to get around the bounding box and so to be able to pass nodes to the method fetchTile
        let corner1 = new RoutableTileNode("");
        let corner2 = new RoutableTileNode("");
        let corner3 = new RoutableTileNode("");
        let corner4 = new RoutableTileNode("");

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
            let rtNode = new RoutableTileNode(n.id);
            rtNode.longitude = n.longitude;
            rtNode.latitude = n.latitude;
            this.localNodes.push(rtNode);
            await this.fetchTile(rtNode);
            const fromTile: RoutableTile = await this.smartTileProvider.fetchCorrectTile(rtNode, true);
            fromTiles.push(fromTile);
        }

        console.log("localNodes in roadplanner: " + this.localNodes);
        const fromTileset = new RoutableTileSet(fromTiles);

        // this won't download anything new
        // but we need the tile data to embed the starting location
        // const fromTileset = await this.baseTileProvider.getMultipleByTileCoords(fromTileCoords);
        await this.pathfinderProvider.embedLocation(from, fromTileset, invert);
    }
}
