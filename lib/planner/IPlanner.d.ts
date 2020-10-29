import { AsyncIterator } from "asynciterator";
import IPath from "../interfaces/IPath";
import IResolvedQuery from "../query-runner/IResolvedQuery";
/**
 * This interface functions as base interface for both the [[IPublicTransportPlanner]]
 * and the [[IRoadPlanner]] interface
 */
export default interface IPlanner {
    plan: (query: IResolvedQuery) => Promise<AsyncIterator<IPath>>;
}
