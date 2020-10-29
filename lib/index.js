"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("isomorphic-fetch");
require("reflect-metadata");
// classes
const main_1 = __importDefault(require("./analytics/isochrones/main"));
const main_2 = __importDefault(require("./analytics/traffic/main"));
// functions
const create_1 = __importDefault(require("./create"));
const classify_1 = __importDefault(require("./data/classify"));
// instances
const RoutableTileRegistry_1 = __importDefault(require("./entities/tiles/RoutableTileRegistry"));
const EventBus_1 = __importDefault(require("./events/EventBus"));
// enums
const Datatypes_1 = __importDefault(require("./data/Datatypes"));
const TravelMode_1 = __importDefault(require("./enums/TravelMode"));
const EventType_1 = __importDefault(require("./events/EventType"));
const QueryMode_1 = __importDefault(require("./QueryMode"));
const Units_1 = __importDefault(require("./util/Units"));
//
// EXPORTS
//
// planners
const DissectPlanner_1 = __importDefault(require("./planner/configurations/DissectPlanner"));
const FlexibleProfileTransitPlanner_1 = __importDefault(require("./planner/configurations/FlexibleProfileTransitPlanner"));
const FlexibleRoadPlanner_1 = __importDefault(require("./planner/configurations/FlexibleRoadPlanner"));
const FlexibleTransitPlanner_1 = __importDefault(require("./planner/configurations/FlexibleTransitPlanner"));
const GeospatialFragmentedPlanner_1 = __importDefault(require("./planner/configurations/GeospatialFragmentedPlanner"));
const ReducedCarPlanner_1 = __importDefault(require("./planner/configurations/ReducedCarPlanner"));
const TriangleTransitPlanner_1 = __importDefault(require("./planner/configurations/TriangleTransitPlanner"));
const ZoiDemoPlanner_1 = __importDefault(require("./planner/configurations/ZoiDemoPlanner"));
// classes
var main_3 = require("./analytics/isochrones/main");
exports.IsochroneGenerator = main_3.default;
var main_4 = require("./analytics/traffic/main");
exports.TrafficEstimator = main_4.default;
// functions
var create_2 = require("./create");
exports.createPlanner = create_2.default;
var classify_2 = require("./data/classify");
exports.classifyDataSource = classify_2.default;
// instances
exports.EventBus = EventBus_1.default.getInstance();
exports.RoutableTileRegistry = RoutableTileRegistry_1.default.getInstance();
// enums
var Datatypes_2 = require("./data/Datatypes");
exports.DataType = Datatypes_2.default;
var TravelMode_2 = require("./enums/TravelMode");
exports.TravelMode = TravelMode_2.default;
var EventType_2 = require("./events/EventType");
exports.EventType = EventType_2.default;
var QueryMode_2 = require("./QueryMode");
exports.QueryMode = QueryMode_2.default;
var Units_2 = require("./util/Units");
exports.Units = Units_2.default;
// planners
var DissectPlanner_2 = require("./planner/configurations/DissectPlanner");
exports.DissectPlanner = DissectPlanner_2.default;
var FlexibleProfileTransitPlanner_2 = require("./planner/configurations/FlexibleProfileTransitPlanner");
exports.FlexibleProfileTransitPlanner = FlexibleProfileTransitPlanner_2.default;
var FlexibleRoadPlanner_2 = require("./planner/configurations/FlexibleRoadPlanner");
exports.FlexibleRoadPlanner = FlexibleRoadPlanner_2.default;
var FlexibleTransitPlanner_2 = require("./planner/configurations/FlexibleTransitPlanner");
exports.FlexibleTransitPlanner = FlexibleTransitPlanner_2.default;
var GeospatialFragmentedPlanner_2 = require("./planner/configurations/GeospatialFragmentedPlanner");
exports.GeospatialFragmentedPlanner = GeospatialFragmentedPlanner_2.default;
var ReducedCarPlanner_2 = require("./planner/configurations/ReducedCarPlanner");
exports.ReducedCarPlanner = ReducedCarPlanner_2.default;
var TriangleTransitPlanner_2 = require("./planner/configurations/TriangleTransitPlanner");
exports.TriangleTransitPlanner = TriangleTransitPlanner_2.default;
var ZoiDemoPlanner_2 = require("./planner/configurations/ZoiDemoPlanner");
exports.ZoiDemoPlanner = ZoiDemoPlanner_2.default;
exports.default = {
    // classes
    IsochroneGenerator: main_1.default,
    TrafficEstimator: main_2.default,
    // functions
    classifyDataSource: classify_1.default,
    createPlanner: create_1.default,
    // instances
    RoutableTileRegistry: exports.RoutableTileRegistry,
    EventBus: exports.EventBus,
    // enums
    TravelMode: TravelMode_1.default,
    EventType: EventType_1.default,
    Units: Units_1.default,
    QueryMode: QueryMode_1.default,
    DataType: Datatypes_1.default,
    // planners
    DissectPlanner: DissectPlanner_1.default,
    FlexibleProfileTransitPlanner: FlexibleProfileTransitPlanner_1.default,
    FlexibleRoadPlanner: FlexibleRoadPlanner_1.default,
    FlexibleTransitPlanner: FlexibleTransitPlanner_1.default,
    GeospatialFragmentedPlanner: GeospatialFragmentedPlanner_1.default,
    ReducedCarPlanner: // experimental
    ReducedCarPlanner_1.default,
    TriangleTransitPlanner: TriangleTransitPlanner_1.default,
    ZoiDemoPlanner: ZoiDemoPlanner_1.default,
};
//# sourceMappingURL=index.js.map