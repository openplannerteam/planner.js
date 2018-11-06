import { DistanceM, DurationMs, SpeedkmH } from "../interfaces/units";

export default class Units {
  public static toSpeed(distance: DistanceM, duration: DurationMs): SpeedkmH {
    return (distance / duration) * 3600;
  }

  public static toDistance(duration: DurationMs, speed: SpeedkmH): DistanceM {
    return (speed * duration) / 3600;
  }

  public static toDuration(distance: DistanceM, speed: SpeedkmH): DurationMs {
    // tslint:disable-next-line:no-bitwise
    return ((distance / speed) * 3600 | 0);
  }

  public static fromHours(hours: number): DurationMs {
    return hours * 3600000;
  }

  public static fromSeconds(seconds: number): DurationMs {
    return seconds * 1000;
  }

}
