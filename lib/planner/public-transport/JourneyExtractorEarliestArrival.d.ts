import { AsyncIterator } from "asynciterator";
import IPath from "../../interfaces/IPath";
import ILocationResolver from "../../query-runner/ILocationResolver";
import IResolvedQuery from "../../query-runner/IResolvedQuery";
import IProfileByStop from "./CSA/data-structure/stops/IProfileByStop";
import IJourneyExtractor from "./IJourneyExtractor";
export default class JourneyExtractorEarliestArrival implements IJourneyExtractor {
    private readonly locationResolver;
    constructor(locationResolver: ILocationResolver);
    extractJourneys(profilesByStop: IProfileByStop, query: IResolvedQuery): Promise<AsyncIterator<IPath>>;
}
