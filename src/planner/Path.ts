import ILeg from "../interfaces/ILeg";
import IPath from "../interfaces/IPath";
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

  /*
  public reverse(): void {
    for (const leg of this.legs) {
      leg.reverse();
    }
    this.legs.reverse();
  }
  */

  public getStartLocationId(): string {
    return (" " + this.legs[0].getStartLocation().id).slice(1);
  }

  /*
  public addTime(duration: DurationMs): void {
    this.steps = this.steps.map((step: IStep) => ({
      ...step,
      startTime: new Date(step.startTime.getTime() + duration),
      stopTime: new Date(step.stopTime.getTime() + duration),
    }));
  }
  */
}
