import { DistanceM, DurationMs, SpeedKmH } from "../interfaces/units";

/**
 * Utility class with calculation functions dealing with [[DistanceM]], [[DurationMs]] and [[SpeedKmH]]
 */
export default class Units {

  public static toSpeed(distance: DistanceM, duration: DurationMs): SpeedKmH {
    return (distance / duration) * 3600;
  }

  public static toDistance(duration: DurationMs, speed: SpeedKmH): DistanceM {
    return (speed * duration) / 3600;
  }

  public static toDuration(distance: DistanceM, speed: SpeedKmH): DurationMs {
    // tslint:disable-next-line:no-bitwise
    return ((distance / speed) * 3600 | 0);
  }

  public static fromHours(hours: number): DurationMs {
    return hours * 3600000;
  }

  public static fromMinutes(minutes: number): DurationMs {
    return minutes * 60000;
  }

  public static fromSeconds(seconds: number): DurationMs {
    return seconds * 1000;
  }

}
