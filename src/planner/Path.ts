import IPath from "../interfaces/IPath";
import IStep from "../interfaces/IStep";

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
}
