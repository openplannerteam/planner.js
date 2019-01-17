import IPath from "../interfaces/IPath";
import IStep from "../interfaces/IStep";
import Step from "./Step";

export default class Path implements IPath {

  public static create(): Path {
    return new Path(
      [],
    );
  }

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
}
