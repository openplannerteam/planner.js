"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../uri/constants");
const uri_1 = __importDefault(require("../uri/uri"));
function getOsmTagMapping() {
    const result = {};
    result[uri_1.default.inNS(constants_1.OSM, "access")] = "accessRestrictions";
    result[uri_1.default.inNS(constants_1.OSM, "bicycle")] = "bicycleAccessRestrictions";
    result[uri_1.default.inNS(constants_1.OSM, "construction")] = "constructionKind";
    result[uri_1.default.inNS(constants_1.OSM, "crossing")] = "crossingKind";
    result[uri_1.default.inNS(constants_1.OSM, "cycleway")] = "cyclewayKind";
    result[uri_1.default.inNS(constants_1.OSM, "footway")] = "footwayKind";
    result[uri_1.default.inNS(constants_1.OSM, "highway")] = "highwayKind";
    result[uri_1.default.inNS(constants_1.OSM, "maxspeed")] = "maxSpeed";
    result[uri_1.default.inNS(constants_1.OSM, "motor_vehicle")] = "motorVehicleAccessRestrictions";
    result[uri_1.default.inNS(constants_1.OSM, "motorcar")] = "motorcarAccessRestrictions";
    result[uri_1.default.inNS(constants_1.OSM, "oneway_bicycle")] = "onewayBicycleKind";
    result[uri_1.default.inNS(constants_1.OSM, "oneway")] = "onewayKind";
    result[uri_1.default.inNS(constants_1.OSM, "smoothness")] = "smoothnessKind";
    result[uri_1.default.inNS(constants_1.OSM, "surface")] = "surfaceKind";
    result[uri_1.default.inNS(constants_1.OSM, "tracktype")] = "trackType";
    result[uri_1.default.inNS(constants_1.OSM, "vehicle")] = "vehicleAccessRestrictions";
    return result;
}
exports.default = getOsmTagMapping;
//# sourceMappingURL=OSMTags.js.map