import { AsyncIterator, EmptyIterator, SingletonIterator } from "asynciterator";
import { inject, injectable } from "inversify";
import Context from "../../Context";
import ILocation from "../../interfaces/ILocation";
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
export default class JourneyExtractorEarliestArrival implements IJourneyExtractor {
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

    while (currentStopId !== departureStopId && (currentProfile.enterConnection || currentProfile.path)) {
      const { enterConnection, exitConnection, path: profilePath } = currentProfile;

      if (profilePath) {
        currentStopId = profilePath.getStartLocationId();

        if (currentStopId === departureStopId) {
          const lastStep = path.steps[path.steps.length - 1];
          const timeToAdd = lastStep.startTime.getTime() - profilePath.steps[0].stopTime.getTime();

          profilePath.addTime(timeToAdd);
        }

        path.addPath(profilePath);
      }

      if (currentProfile.enterConnection && currentProfile.exitConnection) {
        const enterLocation: ILocation = await this.locationResolver.resolve(enterConnection.departureStop);
        const exitLocation: ILocation = await this.locationResolver.resolve(exitConnection.arrivalStop);

        const step: IStep = Step.createFromConnections(
          enterConnection,
          exitConnection,
        );

        step.startLocation = enterLocation;
        step.stopLocation = exitLocation;
        path.addStep(step);

        currentStopId = enterConnection.departureStop;
      }

      currentProfile = profilesByStop[currentStopId];
    }

    if (!path.steps.length) {
      return new EmptyIterator();
    }

    path.reverse();

    return new SingletonIterator<IPath>(path);
  }

}
