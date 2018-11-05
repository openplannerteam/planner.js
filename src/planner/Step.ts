import IConnection from "../fetcher/connections/IConnection";
import ILocation from "../interfaces/ILocation";
import IProbabilisticValue from "../interfaces/IProbabilisticValue";
import IStep from "../interfaces/IStep";
import { DistanceM, DurationMs } from "../interfaces/units";

export default class Step implements IStep {

  public static createFromConnections(enterConnection: IConnection, exitConnection: IConnection): IStep {
    return new Step(
      {id: enterConnection.departureStop},
      {id: exitConnection.arrivalStop},
      {
        minimum: (
          exitConnection.arrivalTime.getTime() -
          enterConnection.departureTime.getTime()
        ),
      },
      enterConnection.departureTime,
      exitConnection.arrivalTime,
    );
  }

  public distance: DistanceM;
  public duration: IProbabilisticValue<DurationMs>;
  public startLocation: ILocation;
  public startTime: Date;
  public stopLocation: ILocation;
  public stopTime: Date;

  constructor(
    startLocation: ILocation,
    stopLocation: ILocation,
    duration: IProbabilisticValue<DurationMs>,
    startTime?: Date,
    stopTime?: Date,
    distance?: DistanceM,
  ) {
    this.distance = distance;
    this.duration = duration;
    this.startLocation = startLocation;
    this.startTime = startTime;
    this.stopLocation = stopLocation;
    this.stopTime = stopTime;
  }
}
