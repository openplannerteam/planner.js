"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Geo_1 = __importDefault(require("../util/Geo"));
/**
 * This Step class serves as an implementation of the [[IStep]] interface and as a home for some helper functions
 * related to [[IStep]] instances
 */
class Step {
    constructor(startLocation, stopLocation, duration, startTime, stopTime, distance, enterConnectionId, exitConnectionId) {
        this.distance = distance;
        this.duration = duration;
        this.startLocation = startLocation;
        this.startTime = startTime;
        this.stopLocation = stopLocation;
        this.stopTime = stopTime;
        this.enterConnectionId = enterConnectionId;
        this.exitConnectionId = exitConnectionId;
    }
    static create(startLocation, stopLocation, duration, through, // string identifier of a way, route, ... that was taken
    startTime, stopTime, distance) {
        return new Step(startLocation, stopLocation, duration, startTime, stopTime, distance, through);
    }
    static createFromConnections(enterConnection, exitConnection) {
        return new Step({ id: enterConnection.departureStop }, { id: exitConnection.arrivalStop }, {
            minimum: (exitConnection.arrivalTime.getTime() -
                enterConnection.departureTime.getTime()),
        }, enterConnection.departureTime, exitConnection.arrivalTime, undefined, enterConnection.id, exitConnection.id);
    }
    /**
     * Compare two [[IStep]] instances
     * @returns true if the two steps are the same
     */
    static compareEquals(step, otherStep) {
        return Step.compareLocations(otherStep.startLocation, step.startLocation) &&
            Step.compareLocations(otherStep.stopLocation, step.stopLocation);
    }
    static compareLocations(a, b) {
        return Geo_1.default.getId(a) === Geo_1.default.getId(b) && a.longitude === b.longitude && a.latitude === b.latitude;
    }
}
exports.default = Step;
//# sourceMappingURL=Step.js.map