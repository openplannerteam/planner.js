import IPoint from "./IPoint";

export default interface IPath {
  distance?: number;
  points: IPoint[];
}
