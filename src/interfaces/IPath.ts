import IStep from "./IStep";

export default interface IPath {
  steps: IStep[];
  departureTime?: Date;
  arrivalTime?: Date;
  transfers?: number;
}
