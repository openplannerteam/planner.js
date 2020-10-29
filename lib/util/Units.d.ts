import { DistanceM, DurationMs, SpeedKmH } from "../interfaces/units";
/**
 * Utility class with calculation functions dealing with [[DistanceM]], [[DurationMs]] and [[SpeedKmH]]
 */
export default class Units {
    static toSpeed(distance: DistanceM, duration: DurationMs): SpeedKmH;
    static toDistance(duration: DurationMs, speed: SpeedKmH): DistanceM;
    static toDuration(distance: DistanceM, speed: SpeedKmH): DurationMs;
    static fromHours(hours: number): DurationMs;
    static fromMinutes(minutes: number): DurationMs;
    static fromSeconds(seconds: number): DurationMs;
}
