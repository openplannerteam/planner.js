import { AsyncIterator } from "asynciterator";
import IPath from "../../interfaces/IPath";
import IResolvedQuery from "../../query-runner/IResolvedQuery";
import IProfilesByStop from "./CSA/data-structure/stops/IProfilesByStop";

export default interface IJourneyExtractor {
  extractJourneys: (profilesByStop: IProfilesByStop, query: IResolvedQuery) => Promise<AsyncIterator<IPath>>;
}
