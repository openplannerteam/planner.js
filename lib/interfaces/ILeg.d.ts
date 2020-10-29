import TravelMode from "../enums/TravelMode";
import ILocation from "./ILocation";
import IStep from "./IStep";
import { DistanceM, DurationMs } from "./units";
export default interface ILeg {
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
