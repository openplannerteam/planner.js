"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const reduced_car_1 = __importDefault(require("../../configs/reduced_car"));
const Planner_1 = __importDefault(require("./Planner"));
class TransitCarPlanner extends Planner_1.default {
    constructor() {
        super(reduced_car_1.default);
        this.setProfileID("http://hdelva.be/profile/car");
    }
    query(query) {
        query.roadNetworkOnly = true;
        return super.query(query);
    }
    async completePath(path) {
        return path;
    }
}
exports.default = TransitCarPlanner;
//# sourceMappingURL=ReducedCarPlanner.js.map