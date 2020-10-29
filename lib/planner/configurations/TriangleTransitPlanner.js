"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const triangle_transit_1 = __importDefault(require("../../configs/triangle_transit"));
const Planner_1 = __importDefault(require("./Planner"));
class TriangleTransitPlanner extends Planner_1.default {
    constructor() {
        super(triangle_transit_1.default);
    }
}
exports.default = TriangleTransitPlanner;
//# sourceMappingURL=TriangleTransitPlanner.js.map