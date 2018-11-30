import { ArrayIterator, AsyncIterator } from "asynciterator";
import { inject, injectable, tagged } from "inversify";
import IConnection from "../../fetcher/connections/IConnection";
import IStop from "../../fetcher/stops/IStop";
import ILocation from "../../interfaces/ILocation";
import IPath from "../../interfaces/IPath";
import IStep from "../../interfaces/IStep";
import ILocationResolver from "../../query-runner/ILocationResolver";
import IResolvedQuery from "../../query-runner/IResolvedQuery";
import TravelMode from "../../TravelMode";
import TYPES from "../../types";
import Iterators from "../../util/Iterators";
import Path from "../Path";
import IRoadPlanner from "../road/IRoadPlanner";
import Step from "../Step";
import IReachableStopsFinder, { IReachableStop } from "../stops/IReachableStopsFinder";
import ReachableStopsFinderMode from "../stops/ReachableStopsFinderMode";
import ReachableStopsSearchPhase from "../stops/ReachableStopsSearchPhase";
import IProfilesByStop from "./CSA/data-structure/stops/IProfilesByStop";
import ITransferProfile from "./CSA/data-structure/stops/ITransferProfile";
import Profile from "./CSA/data-structure/stops/Profile";
import ProfileUtil from "./CSA/util/ProfileUtil";
import IJourneyExtractor from "./IJourneyExtractor";
import JourneyExtractionPhase from "./JourneyExtractionPhase";

/**
 * Creates journeys based on the profiles and query from [[PublicTransportPlannerCSAProfile]].
 * A journey is an [[IPath]] that consist of several [[IStep]]s.
 * The [[JourneyExtractor]] takes care of initial, intermediate and final footpaths.
 *
 * @property bestArrivalTime Stores the best arrival time for each pair of departure-arrival stops.
 */
@injectable()
export default class JourneyExtractorDefault implements IJourneyExtractor {
  private readonly transferRoadPlanner: IRoadPlanner;
  private readonly finalRoadPlanner: IRoadPlanner;
  private readonly initialReachableStopsFinder: IReachableStopsFinder;

  private readonly locationResolver: ILocationResolver;

  private bestArrivalTime: number[][] = [];

  constructor(
    @inject(TYPES.RoadPlanner)
    @tagged("phase", JourneyExtractionPhase.Transfer)
      transferRoadPlanner: IRoadPlanner,
    @inject(TYPES.RoadPlanner)
    @tagged("phase", JourneyExtractionPhase.Final)
      finalRoadPlanner: IRoadPlanner,
    @inject(TYPES.ReachableStopsFinder)
    @tagged("phase", ReachableStopsSearchPhase.Initial)
      initialReachableStopsFinder: IReachableStopsFinder,
    @inject(TYPES.LocationResolver) locationResolver: ILocationResolver,
  ) {
    this.transferRoadPlanner = transferRoadPlanner;
    this.finalRoadPlanner = finalRoadPlanner;
    this.locationResolver = locationResolver;
    this.initialReachableStopsFinder = initialReachableStopsFinder;
  }

  public async extractJourneys(
    profilesByStop: IProfilesByStop,
    query: IResolvedQuery,
  ): Promise<AsyncIterator<IPath>> {
    const filteredProfilesByStop: IProfilesByStop = ProfileUtil.filterInfinity(profilesByStop);

    const departureLocation: IStop = query.from[0] as IStop;

    const reachableStops = await this.initialReachableStopsFinder.findReachableStops(
      departureLocation,
      ReachableStopsFinderMode.Source,
      query.maximumTransferDuration,
      query.minimumWalkingSpeed,
    );

    const paths = [];

    for (const reachableStop of reachableStops) {
      const departureStop: IStop = reachableStop.stop;

      if (!filteredProfilesByStop[departureStop.id]) {
        console.warn("Can't find departure stop: " + departureStop.id);
        continue;
      }

      for (const profile of filteredProfilesByStop[departureStop.id]) {
        if (profile.departureTime >= query.minimumDepartureTime.getTime()) {
          const arrivalStop = query.to[0];

          for (let amountOfTransfers = 0; amountOfTransfers < profile.transferProfiles.length; amountOfTransfers++) {
            const transferProfile = profile.transferProfiles[amountOfTransfers];

            if (this.checkBestArrivalTime(transferProfile, departureStop, arrivalStop)) {
              try {
                paths.push(await this.extractJourney(
                  arrivalStop,
                  reachableStop,
                  profile,
                  amountOfTransfers,
                  filteredProfilesByStop,
                  query,
                ));

                this.setBestArrivalTime(departureStop, arrivalStop, transferProfile.arrivalTime);
              } catch (e) {
                console.warn(e);
              }
            }

          }

        }
      }
    }

    return new ArrayIterator<IPath>(paths);
  }

  private checkBestArrivalTime(
    transferProfile: ITransferProfile,
    departureStop: ILocation,
    arrivalStop: ILocation,
  ): boolean {

    const canArrive = transferProfile.arrivalTime < Infinity;

    if (!canArrive) {
      return false;
    }

    const bestArrivalTimesOfDepartureStop = this.bestArrivalTime[departureStop.id];

    if (!bestArrivalTimesOfDepartureStop) {
      return true;
    }

    const bestArrivalTime = bestArrivalTimesOfDepartureStop[arrivalStop.id];

    if (!bestArrivalTime) {
      return true;
    }

    return transferProfile.arrivalTime < bestArrivalTime;
  }

  private setBestArrivalTime(departureStop: ILocation, arrivalStop: ILocation, arrivalTime: number): void {
    if (!this.bestArrivalTime[departureStop.id]) {
      this.bestArrivalTime[departureStop.id] = [];
    }
    this.bestArrivalTime[departureStop.id][arrivalStop.id] = arrivalTime;
  }

  private async extractJourney(
    arrivalStop: ILocation,
    reachableStop: IReachableStop,
    profile: Profile,
    transfers: number,
    profilesByStop: IProfilesByStop,
    query: IResolvedQuery,
  ): Promise<IPath> {
    let shouldReturn = true;

    // Extract journey for amount of transfers
    const path: Path = Path.create();

    let currentProfile = profile;
    let remainingTransfers = transfers;

    if (reachableStop.duration > 0) {
      const currentTransferProfile = profile.transferProfiles[remainingTransfers];

      this.addInitialFootpath(
        path,
        currentTransferProfile,
        reachableStop,
        query.from[0],
      );
    }

    while (remainingTransfers >= 0) {
      // Construct and push step
      const currentTransferProfile = currentProfile.transferProfiles[remainingTransfers];

      const enterConnection: IConnection = currentTransferProfile.enterConnection;
      const exitConnection: IConnection = currentTransferProfile.exitConnection;

      const step: IStep = Step.createFromConnections(enterConnection, exitConnection);
      path.addStep(step);

      remainingTransfers--;
      if (remainingTransfers >= 0) {
        const nextProfile = profilesByStop[step.stopLocation.id];

        let i = nextProfile.length - 1;
        let found = false;

        while (!found && i >= 0) {
          const nextTransferProfile = nextProfile[i].transferProfiles[remainingTransfers];
          const connection = nextTransferProfile.enterConnection;

          if (connection) {
            const from = await this.locationResolver.resolve(step.stopLocation.id);
            const to = await this.locationResolver.resolve(connection.departureStop);

            const walkingResult = await this.transferRoadPlanner.plan({
              from: [from],
              to: [to],
              minimumWalkingSpeed: query.minimumWalkingSpeed,
              maximumWalkingSpeed: query.maximumWalkingSpeed,
            });

            // Get first path
            const walkingPath: IPath = await Iterators.getFirst(walkingResult);

            if (walkingPath && walkingPath.steps[0] &&
              connection.departureTime.getTime() >= step.stopTime.getTime() +
              walkingPath.steps[0].duration.minimum
            ) {
              found = true;
              path.addStep(walkingPath.steps[0]);
              currentProfile = nextProfile[i];
            }
          }

          i--;
        }

        if (!found) {
          return Promise.reject("Can't reach arrival stop: " + arrivalStop.id + ", transfers: " + transfers);
        }
      }
    }

    if (path.steps[path.steps.length - 1].stopLocation.id !== arrivalStop.id) {
      shouldReturn = await this.addFinalFootpath(path, arrivalStop, query);
    }

    if (!shouldReturn) {
      return Promise.reject("Can't reach arrival stop: " + arrivalStop.id + ", transfers: " + transfers);
    }

    return path as IPath;
  }

  private addInitialFootpath(
    path: Path,
    transferProfile: ITransferProfile,
    reachableStop: IReachableStop,
    startLocation: ILocation,
  ): void {
    const enterConnection: IConnection = transferProfile.enterConnection;
    const stopTime = enterConnection.departureTime;
    const startTime = new Date(stopTime.valueOf() - reachableStop.duration);

    const step = Step.create(
      startLocation,
      reachableStop.stop as ILocation,
      TravelMode.Walking,
      { minimum: reachableStop.duration },
      startTime,
      enterConnection.departureTime,
      undefined,
    );

    path.addStep(step);
  }

  private async addFinalFootpath(path: Path, arrivalStop: ILocation, query: IResolvedQuery): Promise<boolean> {
    const lastStep = path.steps[path.steps.length - 1];

    const fromLocation = await this.locationResolver.resolve(lastStep.stopLocation.id);
    const toLocation = await this.locationResolver.resolve(arrivalStop);

    const walkingResult = await this.finalRoadPlanner.plan({
      from: [fromLocation],
      to: [toLocation],
      minimumWalkingSpeed: query.minimumWalkingSpeed,
      maximumWalkingSpeed: query.maximumWalkingSpeed,
    });

    if (walkingResult && walkingResult[0] && walkingResult[0].steps[0] &&
      query.maximumArrivalTime.getTime() >= lastStep.stopTime.getTime() +
      walkingResult[0].steps[0].duration.minimum) {
      path.addStep(walkingResult[0].steps[0]);
      return true;
    }
    return false;
  }
}
