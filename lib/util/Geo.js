"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const haversine_1 = __importDefault(require("haversine"));
/**
 * Utility class with geographic functions
 */
class Geo {
    /**
     * Calculate the distance between two [[ILocation]] instances using the haversine formula
     * @returns distance is meters ([[DistanceM]])
     */
    static getDistanceBetweenLocations(start, stop) {
        const { longitude: depLongitude, latitude: depLatitude } = start;
        const { longitude: arrLongitude, latitude: arrLatitude } = stop;
        if (depLongitude === undefined || depLatitude === undefined ||
            arrLongitude === undefined || arrLatitude === undefined) {
            return Number.POSITIVE_INFINITY;
        }
        return haversine_1.default({
            latitude: depLatitude,
            longitude: depLongitude,
        }, {
            latitude: arrLatitude,
            longitude: arrLongitude,
        }, {
            unit: "meter",
        });
    }
    /**
     * Calculate tge distance between two [[IStop]] instances using the haversine formula
     * @returns distance is meters ([[DistanceM]])
     */
    static getDistanceBetweenStops(start, stop) {
        return this.getDistanceBetweenLocations(start, stop);
    }
    /**
     * Get the geo id of an [[ILocation]]
     * @param location
     * @returns geo id string
     */
    static getId(location) {
        if ("id" in location) {
            return location.id;
        }
        return `geo:${location.latitude},${location.longitude}`;
    }
}
exports.default = Geo;
//# sourceMappingURL=Geo.js.map