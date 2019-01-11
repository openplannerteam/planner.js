import { ArrayIterator, AsyncIterator } from "asynciterator";
import { inject, injectable } from "inversify";
import Context from "../../Context";
import TravelMode from "../../enums/TravelMode";
import IConnection from "../../fetcher/connections/IConnection";
import ILocation from "../../interfaces/ILocation";
import IPath from "../../interfaces/IPath";
import IStep from "../../interfaces/IStep";
import ILocationResolver from "../../query-runner/ILocationResolver";
import IResolvedQuery from "../../query-runner/IResolvedQuery";
import TYPES from "../../types";
import Path from "../Path";
import Step from "../Step";
import IProfile from "./CSA/data-structure/stops/IProfile";
import IProfilesByStop from "./CSA/data-structure/stops/IProfilesByStop";
import ITransferProfile from "./CSA/data-structure/stops/ITransferProfile";
import ProfileUtil from "./CSA/util/ProfileUtil";
import IJourneyExtractor from "./IJourneyExtractor";

/**
 * Creates journeys based on the profiles and query from [[PublicTransportPlannerCSAProfile]].
 * A journey is an [[IPath]] that consist of several [[IStep]]s.
 * The [[JourneyExtractor]] takes care of initial, intermediate and final footpaths.
 *
 * @property bestArrivalTime Stores the best arrival time for each pair of departure-arrival stops.
 */
@injectable()
export default class JourneyExtractorDefault implements IJourneyExtractor {
  private readonly locationResolver: ILocationResolver;

  private bestArrivalTime: number[][] = [];
  private context: Context;

  constructor(
    @inject(TYPES.LocationResolver) locationResolver: ILocationResolver,
    @inject(TYPES.Context)context?: Context,
  ) {
    this.locationResolver = locationResolver;
    this.context = context;
  }

  public async extractJourneys(
    profilesByStop: IProfilesByStop,
    query: IResolvedQuery,
  ): Promise<AsyncIterator<IPath>> {
    const filteredProfilesByStop: IProfilesByStop = ProfileUtil.filterInfinity(profilesByStop);

    const departureLocation: ILocation = query.from[0];
    const arrivalLocation: ILocation = query.to[0];

    const paths: IPath[] = [];

    const departureLocationProfiles: IProfile[] = filteredProfilesByStop[departureLocation.id];

    // Can't find departure stop;
    if (!departureLocationProfiles) {
      return new ArrayIterator<IPath>(paths);
    }

    for (const profile of departureLocationProfiles) {

      for (let amountOfTransfers = 0; amountOfTransfers < profile.transferProfiles.length; amountOfTransfers++) {
        const transferProfile: ITransferProfile = profile.transferProfiles[amountOfTransfers];

        if (this.checkBestArrivalTime(transferProfile, departureLocation, arrivalLocation)) {
          try {
            paths.push(await this.extractJourney(
              departureLocation,
              arrivalLocation,
              transferProfile,
              amountOfTransfers,
              filteredProfilesByStop,
            ));

            this.setBestArrivalTime(
              departureLocation,
              arrivalLocation,
              transferProfile.arrivalTime,
            );

          } catch (e) {
            this.context.emitWarning(e);
          }
        }
      }
    }

    return new ArrayIterator<IPath>(paths.reverse());
  }

  private checkBestArrivalTime(
    transferProfile: ITransferProfile,
    departureLocation: ILocation,
    arrivalLocation: ILocation,
  ): boolean {

    const canArrive = transferProfile.arrivalTime < Infinity;

    if (!canArrive) {
      return false;
    }

    const bestArrivalTimesOfDepartureStop = this.bestArrivalTime[departureLocation.id];

    if (!bestArrivalTimesOfDepartureStop) {
      return true;
    }

    const bestArrivalTime = bestArrivalTimesOfDepartureStop[arrivalLocation.id];

    if (!bestArrivalTime) {
      return true;
    }

    return transferProfile.arrivalTime < bestArrivalTime;
  }

  private setBestArrivalTime(departureLocation: ILocation, arrivalLocation: ILocation, arrivalTime: number): void {
    if (!this.bestArrivalTime[departureLocation.id]) {
      this.bestArrivalTime[departureLocation.id] = [];
    }
    this.bestArrivalTime[departureLocation.id][arrivalLocation.id] = arrivalTime;
  }

  private async extractJourney(
    departureLocation: ILocation,
    arrivalLocation: ILocation,
    transferProfile: ITransferProfile,
    transfers: number,
    profilesByStop: IProfilesByStop,
  ): Promise<IPath> {
    const path: Path = Path.create();

    let currentTransferProfile: ITransferProfile = transferProfile;
    let departureTime: Date = new Date(transferProfile.departureTime);

    let remainingTransfers: number = transfers;

    let currentLocation: ILocation = departureLocation;

    while (remainingTransfers >= 0) {
      const enterConnection: IConnection = currentTransferProfile.enterConnection;
      const exitConnection: IConnection = currentTransferProfile.exitConnection;

      const enterLocation: ILocation = await this.locationResolver.resolve(enterConnection.departureStop);
      const exitLocation: ILocation = await this.locationResolver.resolve(exitConnection.arrivalStop);

      // Initial or transfer footpath.
      const transferDepartureTime: Date = enterConnection.departureTime;

      if (departureTime.getTime() !== transferDepartureTime.getTime()) {
        const footpath: IStep = Step.create(
          currentLocation,
          enterLocation,
          TravelMode.Walking,
          {
            minimum: transferDepartureTime.getTime() - departureTime.getTime(),
          },
          departureTime,
          transferDepartureTime,
        );

        path.addStep(footpath);
      }

      // Public transport step.
      const step: IStep = Step.createFromConnections(enterConnection, exitConnection);
      step.startLocation = enterLocation;
      step.stopLocation = exitLocation;
      path.addStep(step);

      currentLocation = exitLocation;
      remainingTransfers--;

      // Stop if we already arrived.
      if (path.steps[path.steps.length - 1].stopLocation.id === arrivalLocation.id) {
        break;
      }

      // Get next profile based on the arrival time at the current location.
      if (remainingTransfers >= 0) {
        const currentProfiles: IProfile[] = profilesByStop[currentLocation.id];
        let profileIndex: number = currentProfiles.length - 1;

        currentTransferProfile = currentProfiles[profileIndex].transferProfiles[remainingTransfers];
        departureTime = new Date(currentTransferProfile.departureTime);

        while (profileIndex >= 0 && departureTime < exitConnection.arrivalTime) {
          currentTransferProfile = currentProfiles[--profileIndex].transferProfiles[remainingTransfers];
          departureTime = new Date(currentTransferProfile.departureTime);
        }

        if (profileIndex === -1) {
          // This should never happen.
          return Promise.reject("Can't find next connection");
        }

      }

      // Final footpath.
      if (remainingTransfers === -1) {
        const transferArrivalTime: Date = exitConnection.arrivalTime;
        const arrivalTime: Date = new Date(currentTransferProfile.arrivalTime);

        if (arrivalTime.getTime() !== transferArrivalTime.getTime()) {
          const footpath: IStep = Step.create(
            currentLocation,
            arrivalLocation,
            TravelMode.Walking,
            {
              minimum: arrivalTime.getTime() - transferArrivalTime.getTime(),
            },
            transferArrivalTime,
            arrivalTime,
          );

          path.addStep(footpath);
        }
      }
    }

    // Check if path ends in the arrival location.
    if (path.steps[path.steps.length - 1].stopLocation.id !== arrivalLocation.id) {
      // This should never happen.
      return Promise.reject("Can't reach arrival stop:");
    }

    return path as IPath;
  }
}
