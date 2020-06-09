import ISmartTileProvider from "../../fetcher/tiles/ISmartTileProvider";
import PathfinderProvider from "../../pathfinding/PathfinderProvider";
import IProfileProvider from "../../fetcher/profiles/IProfileProvider";
import ILocationResolver from "../../query-runner/ILocationResolver";
import RoutableTileRegistry from "../../entities/tiles/registry";
import { EventEmitter } from "events";
import ILocation from "../../interfaces/ILocation";
import { inject } from "inversify";
import TYPES from "../../types";
import EventBus from "../../events/EventBus";
import { RoadPlannerPathfindingExperimental, EventType } from "../..";
import defaultContainer from "../../configs/reduced_car";
import IRoadPlanner from "../../planner/road/IRoadPlanner";
import { RoutableTileNode } from "../../entities/tiles/node";
import { TransitTile, ITransitTileIndex } from "../../entities/tiles/tile";
import ITransitTileFetcher from "../../fetcher/tiles/ITransitTileFetcher";

export default class SmartRoadPlannerDemo {
    private smartTileProvider: ISmartTileProvider;
    private pathfinderProvider: PathfinderProvider;
    private profileProvider: IProfileProvider;
    private locationResolver: ILocationResolver;
    private registry: RoutableTileRegistry;
    private eventBus: EventEmitter;
    private planner: IRoadPlanner;

    private localNodes: ILocation[];
    protected metaTiles: ITransitTileIndex = {};
    protected fetcher: ITransitTileFetcher;

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
        const container = defaultContainer;
        this.planner = container.get<IRoadPlanner>(TYPES.RoadPlanner);
        this.fetcher = container.get<ITransitTileFetcher>(TYPES.TransitTileFetcher);

    }

    public async getMetaByUrl(url: string): Promise<TransitTile> {
        if (!this.metaTiles[url]) {
            this.metaTiles[url] = this.fetcher.getMetaData(url);
        }

        return await this.metaTiles[url];
    }

    public async traverseTransitTree(node: ILocation) {

        let tile: TransitTile;

        //for demo purposes
        tile = await this.getMetaByUrl("http://193.190.127.203/tiles/tree/transit_wkt_contracted/0/0/0.json");

        while (tile.getArea().contains(this.localNodes[0]) || tile.getArea().contains(this.localNodes[1])) {

            //for demo purposes
            let newTile: TransitTile;
            for (const rel of tile.getRelations()) {
                if (rel.geoValue.contains(node)) {
                    newTile = await this.getMetaByUrl(rel.id);
                }
            }
            
            if (newTile) {
                this.eventBus.emit(EventType.ReachableLocation, { tileCoordinates: tile.area.area.coordinates, tileNumberX: tile.coordinate.x, tileNumberY: tile.coordinate.y, tileZoom: tile.coordinate.zoom });
                tile = newTile;
            }
            else {
                this.eventBus.emit(EventType.ReachableLocation, { tileCoordinates: tile.area.area.coordinates, tileNumberX: tile.coordinate.x, tileNumberY: tile.coordinate.y, tileZoom: tile.coordinate.zoom });
                this.eventBus.emit(EventType.NoTransitTilePossible);
                console.log("no feasible transit tile found")
                return null;
            }
        }
        this.eventBus.emit(EventType.ReachableLocation, { tileCoordinates: tile.area.area.coordinates, tileNumberX: tile.coordinate.x, tileNumberY: tile.coordinate.y, tileZoom: tile.coordinate.zoom });
        return tile.id;
    }

    public addLocalNodes(nodes: ILocation[]) {
        this.localNodes = nodes;
    }


    public getCorrectTransitTile(startLong: number, startLat: number, stopLong: number, stopLat: number, nodeLong: number, nodeLat: number) {
        this.addLocalNodes([{ latitude: startLat, longitude: startLong }, { latitude: stopLat, longitude: stopLong }]);
        let rtNode = new RoutableTileNode();
        rtNode.longitude = nodeLong;
        rtNode.latitude = nodeLat;
        this.traverseTransitTree(rtNode);

    }

    public planRoute(startLat: number, startLong: number, stopLat: number, stopLong: number){
          this.planner.plan({
            profileID: "https://hdelva.be/profile/car",
            from: [{ latitude: startLat, longitude: startLong }],
            to: [{ latitude: stopLat, longitude: stopLong }],
        }, "http://193.190.127.203/tiles/tree/transit_wkt_contracted/catalog_v2.json").then(
            (resp) => {
                const stop = new Date();
                this.eventBus.emit(EventType.RoutePlanningFinished, {});
                resp.each((path) => {
                    for (let leg of path.legs) {
                        if(leg.getSteps().length == 0){
                            this.eventBus.emit(EventType.NoRouteFound, {});     
                        }
                        console.log(leg.getSteps().length);
                        for (let step of leg.getSteps()) {
                            this.eventBus.emit(EventType.RoutePlanningNextStep, { stepStartLat: step.startLocation.latitude, stepStartLong: step.startLocation.longitude, stepStopLat: step.stopLocation.latitude, stepStopLong: step.stopLocation.longitude });
                            console.log("startLocation: " + step.startLocation.latitude + "-" + step.startLocation.longitude + " , stoplocation: " + step.stopLocation.latitude + "-" + step.stopLocation.longitude);
                        }
                    }
                })
            }
        )
    }

}