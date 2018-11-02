import IStep from "./IStep";

export default interface IPath {
  departureTime?: Date;
  arrivalTime?: Date;
  transfers?: number;
  steps: IStep[];
}
