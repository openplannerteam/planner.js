import IConnection from "../../../fetcher/connections/IConnection";
import ILocation from "../../../interfaces/ILocation";
import IPath from "../../../interfaces/IPath";
import IStep from "../../../interfaces/IStep";
import ILocationResolver from "../../../query-runner/ILocationResolver";
import IResolvedQuery from "../../../query-runner/IResolvedQuery";
import IRoadPlanner from "../../road/IRoadPlanner";
import IProfilesByStop from "./data-structure/IProfilesByStop";
import Profile from "./data-structure/Profile";
import { filterInfinity } from "./utils";

export default class JourneyExtractor {
  public readonly roadPlanner: IRoadPlanner;
  public readonly locationResolver: ILocationResolver;

  private bestArrivalTime: number = Infinity;

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
              if (profile.arrivalTimes[transfers] < this.bestArrivalTime) { // TODO check for all from - to pairs
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

  private async extractJourney(
    arrivalStop: ILocation,
    profile: Profile,
    transfers: number,
    profilesByStop: IProfilesByStop,
    query: IResolvedQuery,
  ): Promise<IPath> {
    // Extract journey for amount of transfers
    const journey: IPath = this.createJourney(profile, transfers);
    this.bestArrivalTime = profile.arrivalTimes[transfers];

    let currentEntry = profile;
    let remainingTransfers = transfers;

    while (remainingTransfers >= 0) {
      // Construct and push step
      const enterConnection: IConnection = currentEntry.enterConnections[remainingTransfers];
      const exitConnection: IConnection = currentEntry.exitConnections[remainingTransfers];

      const step: IStep = this.createStep(enterConnection, exitConnection);
      journey.steps.push(step);

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
            minimumWalkingSpeed: query.minimumWalkingSpeed || 3,
            maximumWalkingSpeed: query.maximumWalkingSpeed || 6,
          });

          if (walkingResult && walkingResult[0] && walkingResult[0].steps[0] &&
            connection.departureTime.getTime() >= step.stopLocation.time.getTime() +
            walkingResult[0].steps[0].duration.average
          ) {
            found = true;
            journey.steps.push(walkingResult[0].steps[0]);
            currentEntry = nextProfile[i];
          }
          i--;
        }
      }
    }

    if (journey.steps[journey.steps.length - 1].stopLocation.id !== arrivalStop.id) {
      await this.addFinalFootpath(journey, arrivalStop, query);
    }

    return journey;
  }

  private createJourney(profile: Profile, transfers: number): IPath {
    return {
      departureTime: new Date(profile.departureTime),
      arrivalTime: new Date(profile.arrivalTimes[transfers]),
      transfers,
      steps: [],
    };
  }

  private createStep(enterConnection: IConnection, exitConnection: IConnection): IStep {
    return {
      startLocation: {
        id: enterConnection.departureStop,
        time: exitConnection.departureTime,
      },
      stopLocation: {
        id: exitConnection.arrivalStop,
        time: exitConnection.arrivalTime,
      },
      duration: {
        average: (
          exitConnection.arrivalTime.getTime() -
          enterConnection.departureTime.getTime()
        ),
      },
    };
  }

  private async addFinalFootpath(journey: IPath, arrivalStop: ILocation, query: IResolvedQuery): Promise<void> {
    const lastStep = journey.steps[journey.steps.length - 1];

    const fromLocation = await this.locationResolver.resolve(lastStep.stopLocation.id );
    const toLocation = await this.locationResolver.resolve(arrivalStop);

    const walkingResult = await this.roadPlanner.plan({
      from: [fromLocation],
      to: [toLocation],
      minimumWalkingSpeed: query.minimumWalkingSpeed || 3,
      maximumWalkingSpeed: query.maximumWalkingSpeed || 6,
    });

    if (walkingResult && walkingResult[0] && walkingResult[0].steps[0]) {
      journey.steps.push(walkingResult[0].steps[0]);
    }
  }
}
