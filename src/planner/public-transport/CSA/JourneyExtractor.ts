import IConnection from "../../../fetcher/connections/IConnection";
import IStop from "../../../fetcher/stops/IStop";
import ILocation from "../../../interfaces/ILocation";
import IPath from "../../../interfaces/IPath";
import IStep from "../../../interfaces/IStep";
import ILocationResolver from "../../../query-runner/ILocationResolver";
import IResolvedQuery from "../../../query-runner/IResolvedQuery";
import TravelMode from "../../../TravelMode";
import Path from "../../Path";
import IRoadPlanner from "../../road/IRoadPlanner";
import Step from "../../Step";
import IReachableStopsFinder, { IReachableStop } from "../../stops/IReachableStopsFinder";
import IProfilesByStop from "./data-structure/stops/IProfilesByStop";
import ITransferProfile from "./data-structure/stops/ITransferProfile";
import Profile from "./data-structure/stops/Profile";
import ProfileUtil from "./util/ProfileUtil";

export default class JourneyExtractor {
  private readonly roadPlanner: IRoadPlanner;
  private readonly locationResolver: ILocationResolver;
  private readonly reachableStopsFinder: IReachableStopsFinder;

  private bestArrivalTime: number[][] = [];

  constructor(
    roadPlanner: IRoadPlanner,
    locationResolver: ILocationResolver,
    reachableStopsFinder: IReachableStopsFinder,
  ) {
    this.roadPlanner = roadPlanner;
    this.locationResolver = locationResolver;
    this.reachableStopsFinder = reachableStopsFinder;
  }

  public async extractJourneys(
    profilesByStop: IProfilesByStop,
    query: IResolvedQuery,
  ): Promise<IPath[]> {
    const filteredProfilesByStop: IProfilesByStop = ProfileUtil.filterInfinity(profilesByStop);

    const journeys = [];
    const departureLocation: IStop = query.from[0] as IStop;

    const reachableStops = await this.reachableStopsFinder.findReachableStops(
      departureLocation,
      query.maximumTransferDuration,
      query.minimumWalkingSpeed,
    );

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
                const journey = await this.extractJourney(
                  arrivalStop,
                  reachableStop,
                  profile,
                  amountOfTransfers,
                  filteredProfilesByStop,
                  query,
                );

                journeys.push(journey);

                this.setBestArrivalTime(departureStop, arrivalStop, transferProfile.arrivalTime);
              } catch (e) {
                console.warn(e);
              }
            }

          }

        }
      }
    }

    return journeys;
  }

  private checkBestArrivalTime(
    transferProfile: ITransferProfile,
    departureStop: ILocation,
    arrivalStop: ILocation,
  ): boolean {
    return transferProfile.arrivalTime < Infinity &&
      (!this.bestArrivalTime[departureStop.id] || !this.bestArrivalTime[departureStop.id][arrivalStop.id] ||
        transferProfile.arrivalTime < this.bestArrivalTime[departureStop.id][arrivalStop.id]);
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

            const walkingResult = await this.roadPlanner.plan({
              from: [from],
              to: [to],
              minimumWalkingSpeed: query.minimumWalkingSpeed,
              maximumWalkingSpeed: query.maximumWalkingSpeed,
            });

            if (walkingResult && walkingResult[0] && walkingResult[0].steps[0] &&
              connection.departureTime.getTime() >= step.stopTime.getTime() +
              walkingResult[0].steps[0].duration.minimum
            ) {
              found = true;
              path.addStep(walkingResult[0].steps[0]);
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

    const walkingResult = await this.roadPlanner.plan({
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
