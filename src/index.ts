import "isomorphic-fetch";
import "reflect-metadata";

// classes
import IsochroneGenerator from "./analytics/isochrones/main";
import TrafficEstimator from "./analytics/traffic/main";
import SmartRoadPlannerDemo from "./analytics/thesis_demo/main";

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
import RoadPlannerPathfindingExperimental from "./planner/road/RoadPlannerPathfindingExperimental";
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
export { default as SmartRoadPlannerDemo } from "./analytics/thesis_demo/main";

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
export { default as RoadPlannerPathfindingExperimental } from "./planner/road/RoadPlannerPathfindingExperimental";

export default {
    // classes
    IsochroneGenerator,
    TrafficEstimator,
    SmartRoadPlannerDemo,

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
    RoadPlannerPathfindingExperimental,
};

import defaultContainer from "./configs/reduced_car";
import TYPES from "./types";
import TransitTileProviderDefault from "./fetcher/tiles/SmartTileProvider";
import ITransitTileProvider from "./fetcher/tiles/ISmartTileProvider";
import { RoutableTileCoordinate } from "./entities/tiles/coordinate";
import IRoadPlanner from "./planner/road/IRoadPlanner";
import { RoutableTileNode } from "./entities/tiles/node";
import ICatalogProvider from "./fetcher/catalog/ICatalogProvider";
import ICatalogFetcher from "./fetcher/catalog/ICatalogFetcher";
import { Catalog } from "./entities/catalog/catalog";
