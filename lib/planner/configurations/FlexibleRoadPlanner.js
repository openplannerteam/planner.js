"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const road_planner_1 = __importDefault(require("../../configs/road_planner"));
const Planner_1 = __importDefault(require("./Planner"));
class FlexibleRoadPlanner extends Planner_1.default {
    constructor() {
        super(road_planner_1.default);
    }
    query(query) {
        query.roadNetworkOnly = true;
        return super.query(query);
    }
    async completePath(path) {
        return path;
    }
}
exports.default = FlexibleRoadPlanner;
//# sourceMappingURL=FlexibleRoadPlanner.js.map