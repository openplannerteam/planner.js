import IConnection from "../fetcher/connections/IConnection";
import ILocation from "../interfaces/ILocation";
import IProbabilisticValue from "../interfaces/IProbabilisticValue";
import IStep from "../interfaces/IStep";
import { DistanceM, DurationMs } from "../interfaces/units";
import TravelMode from "../TravelMode";

export default class Step implements IStep {

  public static create(
    startLocation: ILocation,
    stopLocation: ILocation,
    travelMode: TravelMode,
    duration: IProbabilisticValue<DurationMs>,
    startTime?: Date,
    stopTime?: Date,
    distance?: DistanceM,
  ): IStep {
    return new Step(
      startLocation,
      stopLocation,
      travelMode,
      duration,
      startTime,
      stopTime,
      distance,
    );
  }

  public static createFromConnections(enterConnection: IConnection, exitConnection: IConnection): IStep {
    return new Step(
      {id: enterConnection.departureStop},
      {id: exitConnection.arrivalStop},
      enterConnection.travelMode,
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

  public static compareEquals(step: IStep, otherStep: IStep): boolean {
    if (otherStep.travelMode !== step.travelMode) {
      return false;
    }

    if (otherStep.travelMode === TravelMode.Train || otherStep.travelMode === TravelMode.Bus) {
      return otherStep.enterConnectionId === step.enterConnectionId &&
        otherStep.exitConnectionId === step.exitConnectionId;
    }

    if (otherStep.travelMode === TravelMode.Walking) {
      return Step.compareLocations(otherStep.startLocation, step.startLocation) &&
        Step.compareLocations(otherStep.stopLocation, step.stopLocation);
    }
  }

  private static compareLocations(a: ILocation, b: ILocation): boolean {
    return a.id === b.id && a.longitude === b.longitude && a.latitude === b.latitude;
  }

  public distance: DistanceM;
  public duration: IProbabilisticValue<DurationMs>;
  public startLocation: ILocation;
  public startTime: Date;
  public stopLocation: ILocation;
  public stopTime: Date;
  public travelMode: TravelMode;
  public enterConnectionId: string;
  public exitConnectionId: string;

  constructor(
    startLocation: ILocation,
    stopLocation: ILocation,
    travelMode: TravelMode,
    duration: IProbabilisticValue<DurationMs>,
    startTime?: Date,
    stopTime?: Date,
    distance?: DistanceM,
    enterConnectionId?: string,
    exitConnectionId?: string,
  ) {
    this.distance = distance;
    this.duration = duration;
    this.travelMode = travelMode;
    this.startLocation = startLocation;
    this.startTime = startTime;
    this.stopLocation = stopLocation;
    this.stopTime = stopTime;
    this.enterConnectionId = enterConnectionId;
    this.exitConnectionId = exitConnectionId;
  }
}
