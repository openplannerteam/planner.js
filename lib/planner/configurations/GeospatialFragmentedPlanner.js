"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const geospatial_fragment_1 = __importDefault(require("../../configs/geospatial_fragment"));
const TravelMode_1 = __importDefault(require("../../enums/TravelMode"));
const types_1 = __importDefault(require("../../types"));
const Planner_1 = __importDefault(require("./Planner"));
class GeospatialFragmentedPlanner extends Planner_1.default {
    constructor() {
        super(geospatial_fragment_1.default);
        this.treeProvider = geospatial_fragment_1.default.get(types_1.default.HypermediaTreeProvider);
    }
    addConnectionSource(accessUrl, travelMode = TravelMode_1.default.Train) {
        super.addConnectionSource(accessUrl, travelMode);
        this.treeProvider.addTreeSource(accessUrl);
    }
}
exports.default = GeospatialFragmentedPlanner;
//# sourceMappingURL=GeospatialFragmentedPlanner.js.map