import "isomorphic-fetch";
import "reflect-metadata";
import IsochroneGenerator from "./analytics/isochrones/main";
import Planner from "./Planner";
import RoadPlannerPathfinding from "./planner/road/RoadPlannerPathfinding";

export default {
    RoadPlannerPathfinding,
    Planner,
    IsochroneGenerator,
};
