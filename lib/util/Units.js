"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Utility class with calculation functions dealing with [[DistanceM]], [[DurationMs]] and [[SpeedKmH]]
 */
class Units {
    static toSpeed(distance, duration) {
        return (distance / duration) * 3600;
    }
    static toDistance(duration, speed) {
        return (speed * duration) / 3600;
    }
    static toDuration(distance, speed) {
        // tslint:disable-next-line:no-bitwise
        return ((distance / speed) * 3600 | 0);
    }
    static fromHours(hours) {
        return hours * 3600000;
    }
    static fromMinutes(minutes) {
        return minutes * 60000;
    }
    static fromSeconds(seconds) {
        return seconds * 1000;
    }
}
exports.default = Units;
//# sourceMappingURL=Units.js.map