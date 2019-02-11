import Units from "./util/Units";

/**
 * This class holds the default [[IQuery]]/[[IResolvedQuery]] parameters
 */
export default class Defaults {
  public static readonly defaultMinimumWalkingSpeed = 3;
  public static readonly defaultMaximumWalkingSpeed = 6;
  public static readonly defaultWalkingDuration = Units.fromMinutes(10);
  public static readonly defaultMinimumTransferDuration = Units.fromMinutes(1);
  public static readonly defaultMaximumTransferDuration = Units.fromMinutes(25);
  public static readonly defaultMaximumTransfers = 4;
}
