"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const flexible_transit_1 = __importDefault(require("../../configs/flexible_transit"));
const Planner_1 = __importDefault(require("./Planner"));
class FlexibleTransitPlanner extends Planner_1.default {
    constructor() {
        super(flexible_transit_1.default);
    }
}
exports.default = FlexibleTransitPlanner;
//# sourceMappingURL=FlexibleTransitPlanner.js.map