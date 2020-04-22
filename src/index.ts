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

import defaultContainer from "./configs/triangle_transit";
import TYPES from "./types";
import TransitTileProviderDefault from "./fetcher/tiles/TransitTileProviderDefault";
import { RoutableTileCoordinate } from "./entities/tiles/coordinate";


//INFO: this piece of code uses LDFetch to fetch transit data and transform them to Triples
// const fetcher = new LDFetch();

// fetcher.get("http://192.168.56.1:8080/car/transit/14/8294/5481.json").then(
//     (resp) => {
//         for(const triple of resp.triples){
//             if(triple.object.value === "https://w3id.org/tree#GeospatiallyContainsRelation"){
//                 console.log(triple.object.value);
//             }
//         }
//     });

//INFO: this piece of code tests the TRANSITTILEFETCHER

const container = defaultContainer;
const pathfindingProvider = container.get<PathfinderProvider>(TYPES.PathfinderProvider);
const transitTileFetcher = new TransitTileFetcherRaw(pathfindingProvider);

// transitTileFetcher.get("http://192.168.56.1:8080/car/transit/14/8294/5481.json").then(
//     (resp) =>{
//         console.log(resp);
//     }
// );

// INFO: this piece of code tests the TRANSITTILEPROVIDERDEFAULT

const transitTileDefaultProvider = new TransitTileProviderDefault(transitTileFetcher);

transitTileDefaultProvider.getByTileCoords(new RoutableTileCoordinate(14, 8294, 5488)).then(
    (resp) => {
        console.log(resp);
    }
)