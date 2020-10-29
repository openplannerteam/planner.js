"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dissect_1 = __importDefault(require("../../configs/dissect"));
const TravelMode_1 = __importDefault(require("../../enums/TravelMode"));
const Planner_1 = __importDefault(require("./Planner"));
class DissectPlanner extends Planner_1.default {
    constructor() {
        super(dissect_1.default);
        this.addConnectionSource("https://graph.irail.be/sncb/connections", TravelMode_1.default.Train);
        this.addConnectionSource("https://openplanner.ilabt.imec.be/delijn/Oost-Vlaanderen/connections", TravelMode_1.default.Bus);
        this.addConnectionSource("https://openplanner.ilabt.imec.be/mivb/connections", TravelMode_1.default.Bus);
        this.addStopSource("https://irail.be/stations/NMBS");
        this.addStopSource("https://openplanner.ilabt.imec.be/delijn/Oost-Vlaanderen/stops");
        this.addStopSource("https://openplanner.ilabt.imec.be/mivb/stops");
    }
}
exports.default = DissectPlanner;
//# sourceMappingURL=DissectPlanner.js.map