import { AsyncIterator } from "asynciterator";
import IPath from "../../interfaces/IPath";
import IResolvedQuery from "../../query-runner/IResolvedQuery";
import IProfileByStop from "./CSA/data-structure/stops/IProfileByStop";
import IProfilesByStop from "./CSA/data-structure/stops/IProfilesByStop";

export default interface IJourneyExtractor {
  extractJourneys: (
    profilesByStop: IProfilesByStop | IProfileByStop,
    query: IResolvedQuery,
  ) => Promise<AsyncIterator<IPath>>;
}
