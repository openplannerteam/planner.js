import Units from "./util/Units";

export default class Defaults {
  public static readonly defaultMinimumWalkingSpeed = 3;
  public static readonly defaultMaximumWalkingSpeed = 6;
  public static readonly defaultMaximumTransferDuration = Units.fromHours(.4);
  public static readonly defaultMaximumTransfers = 8;
}
