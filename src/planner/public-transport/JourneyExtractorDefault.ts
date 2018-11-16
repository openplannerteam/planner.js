import { inject, injectable, tagged } from "inversify";
import IConnection from "../../fetcher/connections/IConnection";
import ILocation from "../../interfaces/ILocation";
import IPath from "../../interfaces/IPath";
import IStep from "../../interfaces/IStep";
import ILocationResolver from "../../query-runner/ILocationResolver";
import IResolvedQuery from "../../query-runner/IResolvedQuery";
import TYPES from "../../types";
import Path from "../Path";
import IRoadPlanner from "../road/IRoadPlanner";
import Step from "../Step";
import IProfilesByStop from "./CSA/data-structure/IProfilesByStop";
import Profile from "./CSA/data-structure/Profile";
import ProfileUtil from "./CSA/util/ProfileUtil";
import IJourneyExtractor from "./IJourneyExtractor";
import JourneyExtractionPhase from "./JourneyExtractionPhase";

@injectable()
export default class JourneyExtractorDefault implements IJourneyExtractor {
  private readonly transferRoadPlanner: IRoadPlanner;
  private readonly finalRoadPlanner: IRoadPlanner;
  private readonly locationResolver: ILocationResolver;

  private bestArrivalTime: number[][] = [];

  constructor(
    @inject(TYPES.RoadPlanner)
    @tagged("phase", JourneyExtractionPhase.Transfer)
      transferRoadPlanner: IRoadPlanner,
    @inject(TYPES.RoadPlanner)
    @tagged("phase", JourneyExtractionPhase.Final)
      finalRoadPlanner: IRoadPlanner,
    @inject(TYPES.LocationResolver) locationResolver: ILocationResolver,
  ) {
    this.transferRoadPlanner = transferRoadPlanner;
    this.finalRoadPlanner = finalRoadPlanner;
    this.locationResolver = locationResolver;
  }

  public async extractJourneys(
    profilesByStop: IProfilesByStop,
    query: IResolvedQuery,
  ): Promise<IPath[]> {
    const filteredProfilesByStop: IProfilesByStop = ProfileUtil.filterInfinity(profilesByStop);

    const journeys = [];
    for (const departureStop of query.from) {

      if (!filteredProfilesByStop[departureStop.id]) {
        console.warn("Can't find departure stop: " + departureStop.id);
        continue;
      }

      for (const profile of filteredProfilesByStop[departureStop.id]) {
        if (profile.departureTime >= query.minimumDepartureTime.getTime()) {

          for (let transfers = 0; transfers < profile.arrivalTimes.length; transfers++) {
            for (const arrivalStop of query.to) {
              if (this.checkBestArrivalTime(profile, transfers, departureStop, arrivalStop)) {
                this.setBestArrivalTime(departureStop, arrivalStop, profile.arrivalTimes[transfers]);

                try {
                  const journey = await this.extractJourney(
                    arrivalStop,
                    profile,
                    transfers,
                    filteredProfilesByStop,
                    query,
                  );

                  journeys.push(journey);
                } catch (e) {
                  console.warn(e);
                }
              }
            }
          }
        }

      }
    }

    return journeys;
  }

  private checkBestArrivalTime(
    profile: Profile,
    transfers: number,
    departureStop: ILocation,
    arrivalStop: ILocation,
  ): boolean {
    return profile.arrivalTimes[transfers] < Infinity &&
      (!this.bestArrivalTime[departureStop.id] || !this.bestArrivalTime[departureStop.id][arrivalStop.id] ||
        profile.arrivalTimes[transfers] < this.bestArrivalTime[departureStop.id][arrivalStop.id]);
  }

  private setBestArrivalTime(departureStop: ILocation, arrivalStop: ILocation, arrivalTime: number): void {
    if (!this.bestArrivalTime[departureStop.id]) {
      this.bestArrivalTime[departureStop.id] = [];
    }
    this.bestArrivalTime[departureStop.id][arrivalStop.id] = arrivalTime;
  }

  private async extractJourney(
    arrivalStop: ILocation,
    profile: Profile,
    transfers: number,
    profilesByStop: IProfilesByStop,
    query: IResolvedQuery,
  ): Promise<IPath> {
    let shouldReturn = true;

    // Extract journey for amount of transfers
    const path: Path = Path.create();

    let currentEntry = profile;
    let remainingTransfers = transfers;

    while (remainingTransfers >= 0) {
      // Construct and push step
      const enterConnection: IConnection = currentEntry.enterConnections[remainingTransfers];
      const exitConnection: IConnection = currentEntry.exitConnections[remainingTransfers];

      const step: IStep = Step.createFromConnections(enterConnection, exitConnection);
      path.addStep(step);

      remainingTransfers--;
      if (remainingTransfers >= 0) {
        const nextProfile = profilesByStop[step.stopLocation.id];

        let i = nextProfile.length - 1;
        let found = false;

        while (!found) {
          const connection = nextProfile[i].enterConnections[remainingTransfers];

          const from = await this.locationResolver.resolve(step.stopLocation.id);
          const to = await this.locationResolver.resolve(connection.departureStop);

          const walkingResult = await this.transferRoadPlanner.plan({
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
            currentEntry = nextProfile[i];
          }
          i--;
        }
      }
    }

    if (path.steps[path.steps.length - 1].stopLocation.id !== arrivalStop.id) {
      shouldReturn = await this.addFinalFootpath(path, arrivalStop, query);
    }

    if (!shouldReturn) {
      return Promise.reject("Can't reach arrival stop.");
    }

    return path as IPath;
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
