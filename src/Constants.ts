import Units from "./util/Units";

export default class Constants {
  public static readonly defaultMinimumWalkingSpeed = 3;
  public static readonly defaultMaximumWalkingSpeed = 6;
  public static readonly defaultMaximumTransferDuration = Units.fromHours(.4);
  public static readonly defaultMaximumLegs = 8;
}
