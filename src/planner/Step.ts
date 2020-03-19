import IConnection from "../entities/connections/connections";
import ILocation from "../interfaces/ILocation";
import IProbabilisticValue from "../interfaces/IProbabilisticValue";
import IStep from "../interfaces/IStep";
import { DistanceM, DurationMs } from "../interfaces/units";
import Geo from "../util/Geo";

/**
 * This Step class serves as an implementation of the [[IStep]] interface and as a home for some helper functions
 * related to [[IStep]] instances
 */
export default class Step implements IStep {

  public static create(
    startLocation: ILocation,
    stopLocation: ILocation,
    duration: IProbabilisticValue<DurationMs>,
    through?: string, // string identifier of a way, route, ... that was taken
    startTime?: Date,
    stopTime?: Date,
    distance?: DistanceM,
  ): IStep {
    return new Step(
      startLocation,
      stopLocation,
      duration,
      startTime,
      stopTime,
      distance,
      through,
    );
  }

  public static createFromConnections(enterConnection: IConnection, exitConnection: IConnection): IStep {
    return new Step(
      { id: enterConnection.departureStop },
      { id: exitConnection.arrivalStop },
      {
        minimum: (
          exitConnection.arrivalTime.getTime() -
          enterConnection.departureTime.getTime()
        ),
      },
      enterConnection.departureTime,
      exitConnection.arrivalTime,
      undefined,
      enterConnection.id,
      exitConnection.id,
    );
  }

  /**
   * Compare two [[IStep]] instances
   * @returns true if the two steps are the same
   */
  public static compareEquals(step: IStep, otherStep: IStep): boolean {
    return Step.compareLocations(otherStep.startLocation, step.startLocation) &&
      Step.compareLocations(otherStep.stopLocation, step.stopLocation);
  }

  private static compareLocations(a: ILocation, b: ILocation): boolean {
    return Geo.getId(a) === Geo.getId(b) && a.longitude === b.longitude && a.latitude === b.latitude;
  }

  public distance: DistanceM;
  public duration: IProbabilisticValue<DurationMs>;
  public startLocation: ILocation;
  public startTime: Date;
  public stopLocation: ILocation;
  public stopTime: Date;
  public enterConnectionId: string;
  public exitConnectionId: string;

  constructor(
    startLocation: ILocation,
    stopLocation: ILocation,
    duration: IProbabilisticValue<DurationMs>,
    startTime?: Date,
    stopTime?: Date,
    distance?: DistanceM,
    enterConnectionId?: string,
    exitConnectionId?: string,
  ) {
    this.distance = distance;
    this.duration = duration;
    this.startLocation = startLocation;
    this.startTime = startTime;
    this.stopLocation = stopLocation;
    this.stopTime = stopTime;
    this.enterConnectionId = enterConnectionId;
    this.exitConnectionId = exitConnectionId;
  }
}
