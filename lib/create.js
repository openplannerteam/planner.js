"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
const FlexibleRoadPlanner_1 = __importDefault(require("./planner/configurations/FlexibleRoadPlanner"));
/*
 * Factory method for Planner configurations
 * Picks the most appropriate configuration for the given data sources / query mode
 *
 * !! Due to hypermedia issues none of the tiled data sources are configurable right now
 */
function createPlanner(sources, queryMode) {
    const connectionSources = [];
    const stopSources = [];
    const reducedTileSources = [];
    const footpathSources = [];
    for (const source of sources) {
        if (source.datatype === _1.DataType.Connections) {
            connectionSources.push(source);
        }
        else if (source.datatype === _1.DataType.Stops) {
            stopSources.push(source);
        }
        else if (source.datatype === _1.DataType.ReducedRoutableTile) {
            reducedTileSources.push(source);
        }
        else if (source.datatype === _1.DataType.Footpath) {
            footpathSources.push(source);
        }
    }
    let planner;
    if (queryMode === _1.QueryMode.Dijkstra) {
        if (reducedTileSources.length > 0) {
            planner = new _1.ReducedCarPlanner();
        }
        else {
            planner = new FlexibleRoadPlanner_1.default();
        }
    }
    else {
        if (queryMode === _1.QueryMode.CSAEarliestArrival) {
            if (footpathSources.length > 0) {
                planner = new _1.TriangleTransitPlanner();
            }
            else {
                planner = new _1.FlexibleTransitPlanner();
            }
        }
        else {
            planner = new _1.FlexibleProfileTransitPlanner();
        }
        for (const connectionSource of connectionSources) {
            planner.addConnectionSource(connectionSource.accessUrl);
        }
        for (const stopSource of stopSources) {
            planner.addStopSource(stopSource.accessUrl);
        }
    }
    return planner;
}
exports.default = createPlanner;
//# sourceMappingURL=create.js.map