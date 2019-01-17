import { AsyncIterator, SingletonIterator } from "asynciterator";
import { inject, injectable } from "inversify";
import Context from "../../Context";
import IPath from "../../interfaces/IPath";
import IStep from "../../interfaces/IStep";
import ILocationResolver from "../../query-runner/ILocationResolver";
import IResolvedQuery from "../../query-runner/IResolvedQuery";
import TYPES from "../../types";
import Path from "../Path";
import Step from "../Step";
import IProfileByStop from "./CSA/data-structure/stops/IProfileByStop";
import ITransferProfile from "./CSA/data-structure/stops/ITransferProfile";
import IJourneyExtractor from "./IJourneyExtractor";

/**
 * Creates journeys based on the profiles and query from [[PublicTransportPlannerCSAProfile]].
 * A journey is an [[IPath]] that consist of several [[IStep]]s.
 * The [[JourneyExtractor]] takes care of initial, intermediate and final footpaths.
 *
 * @property bestArrivalTime Stores the best arrival time for each pair of departure-arrival stops.
 */
@injectable()
export default class JourneyExtractorEarliestArrivalTime implements IJourneyExtractor<IProfileByStop> {
  private readonly locationResolver: ILocationResolver;

  private context: Context;

  constructor(
    @inject(TYPES.LocationResolver) locationResolver: ILocationResolver,
    @inject(TYPES.Context)context?: Context,
  ) {
    this.locationResolver = locationResolver;
    this.context = context;
  }

  public async extractJourneys(
    profilesByStop: IProfileByStop,
    query: IResolvedQuery,
  ): Promise<AsyncIterator<IPath>> {
    const path: Path = Path.create();

    const departureStopId: string = query.from[0].id;

    let currentStopId: string = query.to[0].id;
    let currentProfile: ITransferProfile = profilesByStop[currentStopId];

    while (currentStopId !== departureStopId) {
      const step: IStep = Step.createFromConnections(
        currentProfile.enterConnection,
        currentProfile.exitConnection,
      );

      path.addStep(step);

      currentStopId = currentProfile.enterConnection.departureStop;
      currentProfile = profilesByStop[currentStopId];
    }

    path.reverse();

    return new SingletonIterator(path);
  }

}
