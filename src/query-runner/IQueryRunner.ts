import { AsyncIterator } from "asynciterator";
import IPath from "../interfaces/IPath";
import IQuery from "../interfaces/IQuery";

export default interface IQueryRunner {

  run(query: IQuery): Promise<AsyncIterator<IPath>>;
}
