import IPath from "../interfaces/IPath";
import IStep from "../interfaces/IStep";
import { DurationMs } from "../interfaces/units";
import Step from "./Step";

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
    if (path.steps.length !== otherPath.steps.length) {
      return false;
    }

    return path.steps.every((step, stepIndex) => {
      const otherStep = otherPath.steps[stepIndex];

      return Step.compareEquals(step, otherStep);
    });
  }

  public steps: IStep[];

  constructor(steps: IStep[]) {
    this.steps = steps;
  }

  public addStep(step: IStep): void {
    this.steps.push(step);
  }

  public addPath(path: IPath): void {
    this.steps.push(...path.steps);
  }

  public reverse(): void {
    this.steps.reverse();
  }

  public getStartLocationId(): string {
    return (" " + this.steps[0].startLocation.id).slice(1);
  }

  public addTime(duration: DurationMs): void {
    this.steps = this.steps.map((step: IStep) => ({
      ...step,
      startTime: new Date(step.startTime.getTime() + duration),
      stopTime: new Date(step.stopTime.getTime() + duration),
    }));
  }
}
