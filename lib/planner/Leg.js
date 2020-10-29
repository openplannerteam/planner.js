"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Step_1 = __importDefault(require("./Step"));
class Leg {
    constructor(travelMode, steps) {
        this.travelMode = travelMode;
        this.steps = steps;
    }
    static compareEquals(leg, otherLeg) {
        if (leg.getSteps().length !== otherLeg.getSteps().length) {
            return false;
        }
        if (otherLeg.getTravelMode() !== leg.getTravelMode()) {
            return false;
        }
        return leg.getSteps().every((step, stepIndex) => {
            const otherStep = otherLeg.getSteps()[stepIndex];
            return Step_1.default.compareEquals(step, otherStep);
        });
    }
    getExpectedDuration() {
        return this.getAverageDuration() || this.getMinimumDuration() || this.getMaximumDuration();
    }
    getMinimumDuration() {
        return this.steps.reduce((previous, current) => {
            return previous + current.duration.minimum;
        }, 0);
    }
    getAverageDuration() {
        // the average of averages isn't really the average of the whole series
        // but this will have to do
        return this.steps.reduce((previous, current) => {
            return previous + current.duration.average;
        }, 0);
    }
    getMaximumDuration() {
        return this.steps.reduce((previous, current) => {
            return previous + current.duration.maximum;
        }, 0);
    }
    getDistance() {
        return this.steps.reduce((previous, current) => {
            return previous + current.distance;
        }, 0);
    }
    getTravelMode() {
        return this.travelMode;
    }
    getSteps() {
        return this.steps;
    }
    getStartTime() {
        if (this.steps.length > 0) {
            return this.steps[0].startTime;
        }
    }
    getStopTime() {
        if (this.steps.length > 0) {
            return this.steps[this.steps.length - 1].stopTime;
        }
    }
    getStartLocation() {
        if (this.steps.length > 0) {
            return this.steps[0].startLocation;
        }
    }
    getStopLocation() {
        if (this.steps.length > 0) {
            return this.steps[this.steps.length - 1].stopLocation;
        }
    }
}
exports.default = Leg;
//# sourceMappingURL=Leg.js.map