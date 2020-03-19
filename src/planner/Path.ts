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

  public context: object; // lookup table with relevant data
  public legs: ILeg[];

  constructor(legs: ILeg[], context?: object) {
    this.legs = legs;

    if (context) {
      this.context = context;
    } else {
      this.context = {};
    }
  }

  public updateContext(other: object) {
    this.context = Object.assign(this.context, other);
  }

  public addToContext(id: string, value: any) {
    this.context[id] = value;
  }

  public getContext(): object {
    return this.context;
  }

  public getFromContext(id: string): any {
    return this.context[id];
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
    return new Date(query.minimumDepartureTime.getTime() + acc);
  }

  public getTravelTime(query: IQuery): DurationMs {
    return this.getArrivalTime(query).getTime() - this.getDepartureTime(query).getTime();
  }

  public getTransferTime(query: IQuery): DurationMs {
    let time = this.getTravelTime(query);

    for (const leg of this.legs) {
      if (leg.getTravelMode() === TravelMode.Train || leg.getTravelMode() === TravelMode.Bus) {
        time -= leg.getExpectedDuration();
      }
    }

    return time;
  }
}
