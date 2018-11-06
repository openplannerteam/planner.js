import IPath from "../interfaces/IPath";
import IStep from "../interfaces/IStep";

export default class Path implements IPath {

  public static createFromProfile(profile, transfers): Path {
    return new Path(
      [],
      new Date(profile.arrivalTimes[transfers]),
      new Date(profile.departureTime),
      transfers,
    );
  }

  public arrivalTime: Date;
  public departureTime: Date;
  public steps: IStep[];
  public transfers: number;

  constructor(steps: IStep[], arrivalTime?: Date, departureTime?: Date, transfers?: number) {
    this.arrivalTime = arrivalTime;
    this.departureTime = departureTime;
    this.steps = steps;
    this.transfers = transfers;
  }

  public addStep(step: IStep): void {
    this.steps.push(step);
  }
}
