import TravelMode from "../enums/TravelMode";
import ILeg from "../interfaces/ILeg";
import ILocation from "../interfaces/ILocation";
import IStep from "../interfaces/IStep";
import { DistanceM, DurationMs } from "../interfaces/units";
import Step from "./Step";

export default class Leg implements ILeg {
    public static compareEquals(leg: ILeg, otherLeg: ILeg): boolean {
        if (leg.getSteps().length !== otherLeg.getSteps().length) {
            return false;
        }

        if (otherLeg.getTravelMode() !== leg.getTravelMode()) {
            return false;
          }

        return leg.getSteps().every((step, stepIndex) => {
            const otherStep = otherLeg.getSteps()[stepIndex];

            return Step.compareEquals(step, otherStep);
        });
    }

    private travelMode: TravelMode;
    private steps: IStep[];

    public constructor(travelMode: TravelMode, steps: IStep[]) {
        this.travelMode = travelMode;
        this.steps = steps;
    }

    public getExpectedDuration(): DurationMs {
        return this.getAverageDuration() || this.getMinimumDuration() || this.getMaximumDuration();
    }

    public getMinimumDuration(): DurationMs {
        return this.steps.reduce((previous, current) => {
            return previous + current.duration.minimum;
        }, 0);
    }

    public getAverageDuration(): DurationMs {
        // the average of averages isn't really the average of the whole series
        // but this will have to do
        return this.steps.reduce((previous, current) => {
            return previous + current.duration.average;
        }, 0);
    }

    public getMaximumDuration(): DurationMs {
        return this.steps.reduce((previous, current) => {
            return previous + current.duration.maximum;
        }, 0);
    }

    public getDistance(): DistanceM {
        return this.steps.reduce((previous, current) => {
            return previous + current.distance;
        }, 0);
    }

    public getTravelMode(): TravelMode {
        return this.travelMode;
    }

    public getSteps(): IStep[] {
        return this.steps;
    }

    public getStartTime(): Date {
        if (this.steps.length > 0) {
            return this.steps[0].startTime;
        }
    }

    public getStopTime(): Date {
        if (this.steps.length > 0) {
            return this.steps[this.steps.length - 1].stopTime;
        }
    }

    public getStartLocation(): ILocation {
        if (this.steps.length > 0) {
            return this.steps[0].startLocation;
        }
    }

    public getStopLocation(): ILocation {
        if (this.steps.length > 0) {
            return this.steps[this.steps.length - 1].stopLocation;
        }
    }
}
