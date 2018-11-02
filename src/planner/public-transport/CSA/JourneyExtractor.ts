import IConnection from "../../../fetcher/connections/IConnection";
import IPath from "../../../interfaces/IPath";
import IStep from "../../../interfaces/IStep";
import IProfilesByStop from "./dataStructure/IProfilesByStop";
import Profile from "./dataStructure/Profile";
import { filterInfinity } from "./utils";

export default class JourneyExtractor {

  private bestArrivalTime: number = Infinity;

  public extractJourneys(profilesByStop: IProfilesByStop, from: string, to: string, departureTime: Date): IPath[] {
    const profile: IProfilesByStop = filterInfinity(profilesByStop);

    const journeys = [];
    for (const entry of profile[from]) {
      if (entry.departureTime >= departureTime.getTime()) {
        for (let transfers = 0; transfers < entry.arrivalTimes.length; transfers++) {
          if (entry.arrivalTimes[transfers] < this.bestArrivalTime) {
            const journey = this.extractJourney(to, entry, transfers, profile);
            journeys.push(journey);
          }
        }
      }
    }
    return journeys;
  }

  private extractJourney(target: string, entry: Profile, transfers: number, profile: IProfilesByStop): IPath {
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
        // Find profile entry for next step
        // This is the entry with the earliest departure time
        // that is later than the previous arrival time + interstop distance
        const nextProfile = profile[step.stopLocation.id];
        let i = nextProfile.length - 1;
        let found = false;
        // No need to check for i >= 0, journey pointers guarantee that some entry must be valid
        while (!found) {
          const connection = nextProfile[i].enterConnections[remainingTransfers];
          const interstopDistance = { duration: 60000 };
          if (connection.departureTime >= new Date(step.stopLocation.time.getTime() +
            interstopDistance.duration)) {
            found = true;
            journey.steps.push(interstopDistance);
            currentEntry = nextProfile[i];
          }
          i--;
        }
      }
    }

    this.addFinalFootpath(journey, target);

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

  private addFinalFootpath(journey, target) {
    if (journey.steps[journey.steps.length - 1].stopLocation.id !== target) {
      const lastLeg = journey.steps[journey.steps.length - 1];
      const interstopDistance = { duration: 60000 };
      // TODO this is ugly but there is no real exit connection
      journey.steps.push(interstopDistance);
    }
  }
}
