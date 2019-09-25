import TravelMode from "../enums/TravelMode";
import ILeg from "../interfaces/ILeg";
import IPath from "../interfaces/IPath";
import IQuery from "../interfaces/IQuery";
import { DurationMs } from "../interfaces/units";
import Leg from "./Leg";

/**
 * This Path class serves as an implementation of the [[IPath]] interface and as a home for some helper functions
 * related to [[IPath]] instances
 */
export default class Path implements IPath {

  public static create(): Path {
    return new Path(
      [],
    );
  }

  /**
   * Compare two [[IPath]] instances
   * @returns true if the two paths are the same
   */
  public static compareEquals(path: IPath, otherPath: IPath): boolean {
    if (path.legs.length !== otherPath.legs.length) {
      return false;
    }

    return path.legs.every((leg, legIndex) => {
      const otherLeg = otherPath.legs[legIndex];

      return Leg.compareEquals(leg, otherLeg);
    });
  }

  public legs: ILeg[];

  constructor(legs: ILeg[]) {
    this.legs = legs;
  }

  public prependLeg(leg: ILeg) {
    this.legs.unshift(leg);
  }

  public appendLeg(leg: ILeg): void {
    this.legs.push(leg);
  }

  public addPath(path: IPath): void {
    this.legs.push(...path.legs);
  }

  public getStartLocationId(): string {
    return (" " + this.legs[0].getStartLocation().id).slice(1);
  }

  public getDepartureTime(query: IQuery): Date {
    let acc = 0;
    for (const leg of this.legs) {
      if (leg.getStartTime()) {
        return new Date(leg.getStartTime().getTime() - acc);
      } else {
        acc += leg.getExpectedDuration();
      }
    }

    return query.minimumDepartureTime;
  }

  public getArrivalTime(query: IQuery): Date {
    let acc = 0;
    for (let i = this.legs.length - 1; i >= 0; i--) {
      const leg = this.legs[i];
      if (leg.getStopTime()) {
        return new Date(leg.getStopTime().getTime() + acc);
      } else {
        acc += leg.getExpectedDuration();
      }
    }
    return new Date(query.minimumDepartureTime.getTime() + (this.getTravelTime()));
  }

  public getTravelTime(): DurationMs {
    return this.legs.reduce((time, leg) => time + leg.getExpectedDuration(), 0);
  }

  public getTransferTime(): DurationMs {
    let time = this.getTravelTime();

    for (const leg of this.legs) {
      if (leg.getTravelMode() === TravelMode.Train || leg.getTravelMode() === TravelMode.Bus) {
        time -= leg.getExpectedDuration();
      }
    }

    return time;
  }
}
