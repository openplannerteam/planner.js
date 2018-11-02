import IConnection from "../../../fetcher/connections/IConnection";
import ILocation from "../../../interfaces/ILocation";
import IPath from "../../../interfaces/IPath";
import IStep from "../../../interfaces/IStep";
import ILocationResolver from "../../../query-runner/ILocationResolver";
import IRoadPlanner from "../../road/IRoadPlanner";
import IProfilesByStop from "./dataStructure/IProfilesByStop";
import Profile from "./dataStructure/Profile";
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
    from: ILocation,
    to: ILocation,
    departureTime: Date,
  ): Promise<IPath[]> {
    const profile: IProfilesByStop = filterInfinity(profilesByStop);

    const journeys = [];
    for (const entry of profile[from.id]) {
      if (entry.departureTime >= departureTime.getTime()) {
        for (let transfers = 0; transfers < entry.arrivalTimes.length; transfers++) {
          if (entry.arrivalTimes[transfers] < this.bestArrivalTime) {
            const journey = await this.extractJourney(to, entry, transfers, profile);
            journeys.push(journey);
          }
        }
      }
    }
    return journeys;
  }

  private async extractJourney(
    target: ILocation,
    entry: Profile,
    transfers: number,
    profile: IProfilesByStop,
  ): Promise<IPath> {
    // Extract journey for amount of transfers
    const journey: IPath = this.createJourney(entry, transfers);
    this.bestArrivalTime = entry.arrivalTimes[transfers];

    let currentEntry = entry;
    let remainingTransfers = transfers;

    while (remainingTransfers >= 0) {
      // Construct and push step
      const enterConnection: IConnection = currentEntry.enterConnections[remainingTransfers];
      const exitConnection: IConnection = currentEntry.exitConnections[remainingTransfers];

      const step: IStep = this.createStep(enterConnection, exitConnection);
      journey.steps.push(step);

      remainingTransfers--;
      if (remainingTransfers >= 0) {
        const nextProfile = profile[step.stopLocation.id];

        let i = nextProfile.length - 1;
        let found = false;

        while (!found) {
          const connection = nextProfile[i].enterConnections[remainingTransfers];

          const from = await this.locationResolver.resolve({id: step.stopLocation.id });
          const to = await this.locationResolver.resolve({id: connection.departureStop});

          const walkingResult = await this.roadPlanner.plan({
            from: [from],
            to: [to],
            minimumWalkingSpeed: 3,
            maximumWalkingSpeed: 6,
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

    if (journey.steps[journey.steps.length - 1].stopLocation.id !== target) {
      await this.addFinalFootpath(journey, target);
    }

    return journey;
  }

  private createJourney(entry: Profile, transfers: number): IPath {
    return {
      departureTime: new Date(entry.departureTime),
      arrivalTime: new Date(entry.arrivalTimes[transfers]),
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

  private async addFinalFootpath(journey: IPath, to: ILocation): Promise<void> {
    const lastStep = journey.steps[journey.steps.length - 1];

    const fromLocation = await this.locationResolver.resolve({id: lastStep.stopLocation.id });
    const toLocation = await this.locationResolver.resolve(to);

    const walkingResult = await this.roadPlanner.plan({
      from: [fromLocation],
      to: [toLocation],
      minimumWalkingSpeed: 3,
      maximumWalkingSpeed: 6,
    });

    if (walkingResult && walkingResult[0] && walkingResult[0].steps[0]) {
      journey.steps.push(walkingResult[0].steps[0]);
    }
  }
}
