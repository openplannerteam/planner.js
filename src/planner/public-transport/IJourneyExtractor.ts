import { AsyncIterator } from "asynciterator";
import IPath from "../../interfaces/IPath";
import IResolvedQuery from "../../query-runner/IResolvedQuery";

export default interface IJourneyExtractor<T> {
  extractJourneys: (profilesByStop: T, query: IResolvedQuery) => Promise<AsyncIterator<IPath>>;
}
