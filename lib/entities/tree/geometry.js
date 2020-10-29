"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const turf = __importStar(require("@turf/turf"));
class GeometryValue {
    constructor(id) {
        this.id = id;
    }
    static create(id) {
        return new GeometryValue(id);
    }
    contains(location) {
        const pt = turf.point([location.longitude, location.latitude]); // x, y format
        return turf.booleanPointInPolygon(pt, this.area);
    }
}
exports.default = GeometryValue;
//# sourceMappingURL=geometry.js.map