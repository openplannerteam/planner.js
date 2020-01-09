import "isomorphic-fetch";
import "reflect-metadata";

import IsochroneGenerator from "./analytics/isochrones/main";
import TrafficEstimator from "./analytics/traffic/main";
import RoutableTileRegistry_ from "./entities/tiles/registry";
import TravelMode from "./enums/TravelMode";
import EventBus_ from "./events/EventBus";
import EventType from "./events/EventType";
import BasicTrainPlanner from "./planner/configurations/BasicTrainPlanner";
import DelijnNmbsPlanner from "./planner/configurations/DelijnNmbsPlanner";
import DissectPlanner from "./planner/configurations/DissectPlanner";
import FlexibleProfileTransitPlanner from "./planner/configurations/FlexibleProfileTransitPlanner";
import FlexibleTransitPlanner from "./planner/configurations/FlexibleTransitPlanner";
import GeospatialFragmentedPlanner from "./planner/configurations/GeospatialFragmentedPlanner";
import TransitCarPlanner from "./planner/configurations/TransitCarPlanner";
import TriangleDemoPlanner from "./planner/configurations/TriangleDemoPlanner";
import Units from "./util/Units";

export { default as EventType } from "./events/EventType";
export { default as IsochroneGenerator } from "./analytics/isochrones/main";
export { default as TrafficEstimator } from "./analytics/traffic/main";
export { default as Units } from "./util/Units";
export { default as BasicTrainPlanner } from "./planner/configurations/BasicTrainPlanner";
export { default as DelijnNmbsPlanner } from "./planner/configurations/DelijnNmbsPlanner";
export { default as DissectPlanner } from "./planner/configurations/DissectPlanner";
export { default as TransitCarPlanner } from "./planner/configurations/TransitCarPlanner";
export { default as FlexibleTransitPlanner } from "./planner/configurations/FlexibleTransitPlanner";
export { default as FlexibleProfileTransitPlanner } from "./planner/configurations/FlexibleProfileTransitPlanner";
export { default as GeospatialFragmentedPlanner } from "./planner/configurations/GeospatialFragmentedPlanner";
export { default as TriangleDemoPlanner } from "./planner/configurations/TriangleDemoPlanner";
export { default as TravelMode } from "./enums/TravelMode";

export const EventBus = EventBus_.getInstance();
export const RoutableTileRegistry = RoutableTileRegistry_.getInstance();

export default {
    TravelMode,
    EventType,
    IsochroneGenerator,
    TrafficEstimator,
    Units,
    EventBus,
    BasicTrainPlanner,
    DelijnNmbsPlanner,
    DissectPlanner,
    TransitCarPlanner,
    TriangleDemoPlanner,
    RoutableTileRegistry,
    FlexibleTransitPlanner,
    FlexibleProfileTransitPlanner,
    GeospatialFragmentedPlanner,
};
