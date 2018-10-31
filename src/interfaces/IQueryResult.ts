import IPath from "./IPath";

export default interface IQueryResult {
  paths?: IPath[];
  error?: Error;
}
