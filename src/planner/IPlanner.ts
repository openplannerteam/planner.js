import { AsyncIterator } from "asynciterator";
import IPath from "../interfaces/IPath";
import IResolvedQuery from "../query-runner/IResolvedQuery";

export default interface IPlanner {
  plan: (query: IResolvedQuery) => Promise<AsyncIterator<IPath>>;
}
