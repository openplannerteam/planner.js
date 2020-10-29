"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zoi_demo_planner_1 = __importDefault(require("../../configs/zoi_demo_planner"));
const Planner_1 = __importDefault(require("./Planner"));
class ZoiDemoPlanner extends Planner_1.default {
    constructor() {
        super(zoi_demo_planner_1.default);
    }
    query(query) {
        query.roadNetworkOnly = true;
        return super.query(query);
    }
    async completePath(path) {
        return path;
    }
}
exports.default = ZoiDemoPlanner;
//# sourceMappingURL=ZoiDemoPlanner.js.map