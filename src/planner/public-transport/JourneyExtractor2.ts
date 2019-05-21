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

@injectable()
export default class JourneyExtractor2 implements IJourneyExtractor {
  private readonly locationResolver: ILocationResolver;

  private context: Context;

  constructor(
    @inject(TYPES.LocationResolver) locationResolver: ILocationResolver,
    @inject(TYPES.Context) context?: Context,
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

    while (currentStopId !== departureStopId &&
      profilesByStop[currentStopId] &&
      profilesByStop[currentStopId].exitConnection) {

      const currentProfile: ITransferProfile = profilesByStop[currentStopId];
      const { enterConnection, exitConnection } = currentProfile;
      const promises = [
        this.locationResolver.resolve(enterConnection.departureStop),
        this.locationResolver.resolve(exitConnection.arrivalStop),
      ];
      const [enterLocation, exitLocation] = await Promise.all(promises);

      const arrivalTime = exitConnection.arrivalTime;
      const departureTime = enterConnection.departureTime;
      const duration = arrivalTime.getTime() - departureTime.getTime();

      const step = new Step(
        enterLocation,
        exitLocation,
        exitConnection.travelMode,
        { average: duration },
        departureTime,
        arrivalTime,
        undefined,
        enterConnection.id,
        exitConnection.id,
      );

      path.addStep(step);
      currentStopId = enterConnection.departureStop;
    }

    if (!path.steps.length) {
      return new EmptyIterator();
    }

    path.reverse();

    return new SingletonIterator<IPath>(path);
  }

}
