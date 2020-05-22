import "isomorphic-fetch";
import "reflect-metadata";

// classes
import IsochroneGenerator from "./analytics/isochrones/main";
import TrafficEstimator from "./analytics/traffic/main";

// functions
import createPlanner from "./create";
import classifyDataSource from "./data/classify";

// instances
import RoutableTileRegistry_ from "./entities/tiles/registry";
import EventBus_ from "./events/EventBus";

// enums
import DataType from "./data/Datatypes";
import TravelMode from "./enums/TravelMode";
import EventType from "./events/EventType";
import QueryMode from "./QueryMode";
import Units from "./util/Units";

//
// EXPORTS
//

// planners
import DissectPlanner from "./planner/configurations/DissectPlanner";
import FlexibleProfileTransitPlanner from "./planner/configurations/FlexibleProfileTransitPlanner";
import FlexibleRoadPlanner from "./planner/configurations/FlexibleRoadPlanner";
import FlexibleTransitPlanner from "./planner/configurations/FlexibleTransitPlanner";
import GeospatialFragmentedPlanner from "./planner/configurations/GeospatialFragmentedPlanner";
import ReducedCarPlanner from "./planner/configurations/ReducedCarPlanner";
import TriangleTransitPlanner from "./planner/configurations/TriangleTransitPlanner";
import RoadPlannerPathfinding from "./planner/road/RoadPlannerPathfinding";
import PathfinderProvider from "./pathfinding/PathfinderProvider";
import LDFetch from "./fetcher/LDFetch";
import RoutableTileProviderDefault from "./fetcher/tiles/RoutableTileProviderDefault";
import RoutableTileFetcherRaw from "./fetcher/tiles/RoutableTileFetcherRaw";
import DijkstraTree from "./pathfinding/dijkstra-tree/DijkstraTree";
import { Dijkstra } from "./pathfinding/dijkstra/Dijkstra";
import ProfileProviderDefault from "./fetcher/profiles/ProfileProviderDefault";
import ProfileFetcherDefault from "./fetcher/profiles/ProfileFetcherDefault";
import LocationResolverDefault from "./query-runner/LocationResolverDefault";
import StopsProviderDefault from "./fetcher/stops/StopsProviderDefault";
import StopsFetcherLDFetch from "./fetcher/stops/ld-fetch/StopsFetcherLDFetch";
import TransitTileFetcherRaw from "./fetcher/tiles/TransitTileFetcherRaw";
import SmartTileProvider from "./fetcher/tiles/SmartTileProvider";
import { classifyDataSet } from "./data/classify";

// classes
export { default as IsochroneGenerator } from "./analytics/isochrones/main";
export { default as TrafficEstimator } from "./analytics/traffic/main";

// functions
export { default as createPlanner } from "./create";
export { default as classifyDataSource } from "./data/classify";

// instances
export const EventBus = EventBus_.getInstance();
export const RoutableTileRegistry = RoutableTileRegistry_.getInstance();

// enums
export { default as DataType } from "./data/Datatypes";
export { default as TravelMode } from "./enums/TravelMode";
export { default as EventType } from "./events/EventType";
export { default as QueryMode } from "./QueryMode";
export { default as Units } from "./util/Units";

// planners
export { default as DissectPlanner } from "./planner/configurations/DissectPlanner";
export { default as FlexibleProfileTransitPlanner } from "./planner/configurations/FlexibleProfileTransitPlanner";
export { default as FlexibleRoadPlanner } from "./planner/configurations/FlexibleRoadPlanner";
export { default as FlexibleTransitPlanner } from "./planner/configurations/FlexibleTransitPlanner";
export { default as GeospatialFragmentedPlanner } from "./planner/configurations/GeospatialFragmentedPlanner";
export { default as ReducedCarPlanner } from "./planner/configurations/ReducedCarPlanner";
export { default as TriangleTransitPlanner } from "./planner/configurations/TriangleTransitPlanner";

export default {
    // classes
    IsochroneGenerator,
    TrafficEstimator,

    // functions
    classifyDataSource,
    createPlanner,

    // instances
    RoutableTileRegistry,
    EventBus,

    // enums
    TravelMode,
    EventType,
    Units,
    QueryMode,
    DataType,

    // planners
    DissectPlanner,
    FlexibleProfileTransitPlanner,
    FlexibleRoadPlanner,
    FlexibleTransitPlanner,
    GeospatialFragmentedPlanner, // experimental
    ReducedCarPlanner,
    TriangleTransitPlanner,
};

import defaultContainer from "./configs/reduced_car";
import TYPES from "./types";
import TransitTileProviderDefault from "./fetcher/tiles/SmartTileProvider";
import ITransitTileProvider from "./fetcher/tiles/ISmartTileProvider";
import { RoutableTileCoordinate } from "./entities/tiles/coordinate";
import RoadPlannerPathfindingExperimental from "./planner/road/RoadPlannerPathfindingExperimental";
import IRoadPlanner from "./planner/road/IRoadPlanner";
import { RoutableTileNode } from "./entities/tiles/node";
import ICatalogProvider from "./fetcher/catalog/ICatalogProvider";
import ICatalogFetcher from "./fetcher/catalog/ICatalogFetcher";
import { Catalog } from "./entities/catalog/catalog";

const container = defaultContainer;

// // TEST PLANNER

const planner = container.get<IRoadPlanner>(TYPES.RoadPlanner);

const start = new Date();
const startTime = start.getTime();

planner.plan({
    profileID: "https://hdelva.be/profile/car",
    from: [{ latitude: 50.93278, longitude: 5.32665 }], // Pita Aladin, Hasselt
    to: [{ latitude: parseFloat(process.argv[3]), longitude: parseFloat(process.argv[2]) }], // Burger Pita Pasta, Menen
}, "http://193.190.127.203/tiles/tree/transit_wkt_contracted/catalog_v2.json").then(
    (resp) => {
        const stop = new Date();
        const stopTime = stop.getTime();
        console.log((stopTime - startTime) / 1000);
        resp.each((path) => {
            for (let leg of path.legs) {
                console.log(leg.getSteps().length);
                console.log("Num of req: " + SmartTileProvider.numReq)
                for (let step of leg.getSteps()) {
                    //console.log("startLocation: " + step.startLocation.latitude + "-" + step.startLocation.longitude + " , stoplocation: " + step.stopLocation.latitude + "-" + step.stopLocation.longitude);
                }
                //console.log(leg.getSteps()[0].duration);
            }
        })
    }
)