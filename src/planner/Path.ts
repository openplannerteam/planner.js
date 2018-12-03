import IPath from "../interfaces/IPath";
import IStep from "../interfaces/IStep";
import Step from "./Step";

export default class Path implements IPath {

  public static create(): Path {
    return new Path(
      [],
    );
  }

  public steps: IStep[];

  constructor(steps: IStep[]) {
    this.steps = steps;
  }

  public addStep(step: IStep): void {
    this.steps.push(step);
  }

  public equals(path: IPath): boolean {

    if (this.steps.length !== path.steps.length) {
      return false;
    }

    return this.steps.every((step, stepIndex) => {
      const otherStep = path.steps[stepIndex];

      return Step.compareEquals(step, otherStep);
    });
  }
}
