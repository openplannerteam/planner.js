import IConnection from "../../../fetcher/connections/IConnection";
import ILocation from "../../../interfaces/ILocation";
import IPath from "../../../interfaces/IPath";
import IStep from "../../../interfaces/IStep";
import ILocationResolver from "../../../query-runner/ILocationResolver";
import IResolvedQuery from "../../../query-runner/IResolvedQuery";
import Path from "../../Path";
import IRoadPlanner from "../../road/IRoadPlanner";
import Step from "../../Step";
import IProfilesByStop from "./data-structure/IProfilesByStop";
import Profile from "./data-structure/Profile";
import { filterInfinity } from "./util/vectors";

export default class JourneyExtractor {
  private readonly roadPlanner: IRoadPlanner;
  private readonly locationResolver: ILocationResolver;

  private bestArrivalTime: number[][] = [];

  constructor(roadPlanner: IRoadPlanner, locationResolver: ILocationResolver) {
    this.roadPlanner = roadPlanner;
    this.locationResolver = locationResolver;
  }

  public async extractJourneys(
    profilesByStop: IProfilesByStop,
    query: IResolvedQuery,
  ): Promise<IPath[]> {
    const filteredProfilesByStop: IProfilesByStop = filterInfinity(profilesByStop);

    const journeys = [];
    for (const departureStop of query.from) {

      for (const profile of filteredProfilesByStop[departureStop.id]) {
        if (profile.departureTime >= query.minimumDepartureTime.getTime()) {

          for (let transfers = 0; transfers < profile.arrivalTimes.length; transfers++) {
            for (const arrivalStop of query.to) {
              if (this.checkBestArrivalTime(profile, transfers, departureStop, arrivalStop)) {
                this.setBestArrivalTime(departureStop, arrivalStop, profile.arrivalTimes[transfers]);

                const journey = await this.extractJourney(
                  arrivalStop,
                  profile,
                  transfers,
                  filteredProfilesByStop,
                  query,
                );

                journeys.push(journey);
              }
            }
          }
        }

      }
    }

    return journeys;
  }

  private checkBestArrivalTime(profile: Profile, transfers: number, departureStop: ILocation, arrivalStop: ILocation) {
    return profile.arrivalTimes[transfers] < Infinity &&
      (!this.bestArrivalTime[departureStop.id] || !this.bestArrivalTime[departureStop.id][arrivalStop.id] ||
      profile.arrivalTimes[transfers] < this.bestArrivalTime[departureStop.id][arrivalStop.id]);
  }

  private setBestArrivalTime(departureStop: ILocation, arrivalStop: ILocation, arrivalTime: number) {
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
    // Extract journey for amount of transfers
    const path: Path = Path.createFromProfile(profile, transfers);

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
            currentEntry = nextProfile[i];
          }
          i--;
        }
      }
    }

    if (path.steps[path.steps.length - 1].stopLocation.id !== arrivalStop.id) {
      await this.addFinalFootpath(path, arrivalStop, query);
    }

    return path as IPath;
  }

  private async addFinalFootpath(path: Path, arrivalStop: ILocation, query: IResolvedQuery): Promise<void> {
    const lastStep = path.steps[path.steps.length - 1];

    const fromLocation = await this.locationResolver.resolve(lastStep.stopLocation.id );
    const toLocation = await this.locationResolver.resolve(arrivalStop);

    const walkingResult = await this.roadPlanner.plan({
      from: [fromLocation],
      to: [toLocation],
      minimumWalkingSpeed: query.minimumWalkingSpeed,
      maximumWalkingSpeed: query.maximumWalkingSpeed,
    });

    if (walkingResult && walkingResult[0] && walkingResult[0].steps[0]) {
      path.addStep(walkingResult[0].steps[0]);
    }
  }
}
