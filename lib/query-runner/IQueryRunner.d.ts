import { AsyncIterator } from "asynciterator";
import IPath from "../interfaces/IPath";
import IQuery from "../interfaces/IQuery";
/**
 * A query runner has a `run` method that turns an [[IQuery]] into an AsyncIterator of [[IPath]] instances.
 * It does this by executing one or more algorithms on the query, depending on the implementation.
 */
export default interface IQueryRunner {
    run(query: IQuery): Promise<AsyncIterator<IPath>>;
}
