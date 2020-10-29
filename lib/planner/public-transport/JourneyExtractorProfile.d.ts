import { AsyncIterator } from "asynciterator";
import IPath from "../../interfaces/IPath";
import ILocationResolver from "../../query-runner/ILocationResolver";
import IResolvedQuery from "../../query-runner/IResolvedQuery";
import IProfilesByStop from "./CSA/data-structure/stops/IProfilesByStop";
import IJourneyExtractor from "./IJourneyExtractor";
/**
 * Creates journeys based on the profiles and query from [[CSAProfile]].
 * A journey is an [[IPath]] that consist of several [[IStep]]s.
 *
 * @property bestArrivalTime Stores the best arrival time for each pair of departure-arrival stops.
 */
export default class JourneyExtractorProfile implements IJourneyExtractor {
    private readonly locationResolver;
    private bestArrivalTime;
    private eventBus;
    constructor(locationResolver: ILocationResolver);
    extractJourneys(profilesByStop: IProfilesByStop, query: IResolvedQuery): Promise<AsyncIterator<IPath>>;
    private checkBestArrivalTime;
    private setBestArrivalTime;
    private extractJourney;
}
