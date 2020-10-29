import TravelMode from "../enums/TravelMode";
import ILeg from "../interfaces/ILeg";
import ILocation from "../interfaces/ILocation";
import IStep from "../interfaces/IStep";
import { DistanceM, DurationMs } from "../interfaces/units";
export default class Leg implements ILeg {
    static compareEquals(leg: ILeg, otherLeg: ILeg): boolean;
    private travelMode;
    private steps;
    constructor(travelMode: TravelMode, steps: IStep[]);
    getExpectedDuration(): DurationMs;
    getMinimumDuration(): DurationMs;
    getAverageDuration(): DurationMs;
    getMaximumDuration(): DurationMs;
    getDistance(): DistanceM;
    getTravelMode(): TravelMode;
    getSteps(): IStep[];
    getStartTime(): Date;
    getStopTime(): Date;
    getStartLocation(): ILocation;
    getStopLocation(): ILocation;
}
