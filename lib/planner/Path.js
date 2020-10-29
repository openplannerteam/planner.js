"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const TravelMode_1 = __importDefault(require("../enums/TravelMode"));
const Leg_1 = __importDefault(require("./Leg"));
/**
 * This Path class serves as an implementation of the [[IPath]] interface and as a home for some helper functions
 * related to [[IPath]] instances
 */
class Path {
    constructor(legs, context) {
        this.legs = legs;
        if (context) {
            this.context = context;
        }
        else {
            this.context = {};
        }
    }
    static create() {
        return new Path([]);
    }
    /**
     * Compare two [[IPath]] instances
     * @returns true if the two paths are the same
     */
    static compareEquals(path, otherPath) {
        if (path.legs.length !== otherPath.legs.length) {
            return false;
        }
        return path.legs.every((leg, legIndex) => {
            const otherLeg = otherPath.legs[legIndex];
            return Leg_1.default.compareEquals(leg, otherLeg);
        });
    }
    updateContext(other) {
        this.context = Object.assign(this.context, other);
    }
    addToContext(id, value) {
        this.context[id] = value;
    }
    getContext() {
        return this.context;
    }
    getFromContext(id) {
        return this.context[id];
    }
    prependLeg(leg) {
        this.legs.unshift(leg);
    }
    appendLeg(leg) {
        this.legs.push(leg);
    }
    addPath(path) {
        this.legs.push(...path.legs);
    }
    getStartLocationId() {
        return (" " + this.legs[0].getStartLocation().id).slice(1);
    }
    getDepartureTime(query) {
        let acc = 0;
        for (const leg of this.legs) {
            if (leg.getStartTime()) {
                return new Date(leg.getStartTime().getTime() - acc);
            }
            else {
                acc += leg.getExpectedDuration();
            }
        }
        return query.minimumDepartureTime;
    }
    getArrivalTime(query) {
        let acc = 0;
        for (let i = this.legs.length - 1; i >= 0; i--) {
            const leg = this.legs[i];
            if (leg.getStopTime()) {
                return new Date(leg.getStopTime().getTime() + acc);
            }
            else {
                acc += leg.getExpectedDuration();
            }
        }
        return new Date(query.minimumDepartureTime.getTime() + acc);
    }
    getTravelTime(query) {
        return this.getArrivalTime(query).getTime() - this.getDepartureTime(query).getTime();
    }
    getTransferTime(query) {
        let time = this.getTravelTime(query);
        for (const leg of this.legs) {
            if (leg.getTravelMode() === TravelMode_1.default.Train || leg.getTravelMode() === TravelMode_1.default.Bus) {
                time -= leg.getExpectedDuration();
            }
        }
        return time;
    }
}
exports.default = Path;
//# sourceMappingURL=Path.js.map