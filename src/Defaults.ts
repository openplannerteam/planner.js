import Units from "./util/Units";

export default class Defaults {
  public static readonly defaultMinimumWalkingSpeed = 3;
  public static readonly defaultMaximumWalkingSpeed = 6;
  public static readonly defaultWalkingDuration = Units.fromSeconds(10 * 60);
  public static readonly defaultMinimumTransferDuration = Units.fromSeconds(60);
  public static readonly defaultMaximumTransferDuration = Units.fromHours(.4);
  public static readonly defaultMaximumTransfers = 4;
}
