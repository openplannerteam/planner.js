import { inject, injectable } from "inversify";
import IConnection from "../../fetcher/connections/IConnection";
import IConnectionsFetcher from "../../fetcher/connections/IConnectionsFetcher";
import IPath from "../../interfaces/IPath";
import ILocationResolver from "../../query-runner/ILocationResolver";
import IResolvedQuery from "../../query-runner/IResolvedQuery";
import TYPES from "../../types";
import IRoadPlanner from "../road/IRoadPlanner";
import IEarliestArrival from "./CSA/data-structure/EarliestArrival";
import EarliestArrival from "./CSA/data-structure/EarliestArrival";
import IArrivalTimeByTransfers from "./CSA/data-structure/IArrivalTimeByTransfers";
import IEarliestArrivalByTrip from "./CSA/data-structure/IEarliestArrivalByTrip";
import IProfilesByStop from "./CSA/data-structure/IProfilesByStop";
import Profile from "./CSA/data-structure/Profile";
import JourneyExtractor from "./CSA/JourneyExtractor";
import { evalProfile, minVector, shiftVector } from "./CSA/utils";
import IPublicTransportPlanner from "./IPublicTransportPlanner";

@injectable()
export default class PublicTransportPlannerCSAProfile implements IPublicTransportPlanner {
  public readonly connectionsFetcher: IConnectionsFetcher;
  public readonly roadPlanner: IRoadPlanner;
  public readonly locationResolver: ILocationResolver;

  private readonly journeyExtractor: JourneyExtractor;

  private profilesByStop: IProfilesByStop = {}; // S
  private earliestArrivalByTrip: IEarliestArrivalByTrip = {}; // T

  private D: number[] = [];
  private maxLegs: number = 8;

  private query: IResolvedQuery;

  constructor(
    @inject(TYPES.ConnectionsFetcher) connectionsFetcher: IConnectionsFetcher,
    @inject(TYPES.RoadPlanner) roadPlanner: IRoadPlanner,
    @inject(TYPES.LocationResolver) locationResolver: ILocationResolver,
  ) {
    this.connectionsFetcher = connectionsFetcher;
    this.roadPlanner = roadPlanner;
    this.locationResolver = locationResolver;

    this.journeyExtractor = new JourneyExtractor(roadPlanner, locationResolver);
  }

  public async plan(query: IResolvedQuery): Promise<IPath[]> {
    this.query = query;

    this.setConnectionsFetcherConfig();

    return await this.calculateJourneys();
  }

  private setConnectionsFetcherConfig() {
    let upperBoundDate;
    let lowerBoundDate;

    if (this.query.maximumArrivalTime) {
      upperBoundDate = this.query.maximumArrivalTime;
    } else {
      upperBoundDate = new Date();
      upperBoundDate.setHours(upperBoundDate.getHours() + 2);
    }

    if (this.query.minimumDepartureTime) {
      lowerBoundDate = this.query.minimumDepartureTime;
    } else {
      lowerBoundDate = new Date();
    }

    this.query.maximumArrivalTime = upperBoundDate;
    this.query.minimumDepartureTime = lowerBoundDate;

    this.connectionsFetcher.setConfig({
      backward: true,
      upperBoundDate,
      lowerBoundDate,
    });
  }

  private async calculateJourneys(): Promise<IPath[]> {
    for await (const connection of this.connectionsFetcher) {
      if (connection.departureTime < this.query.minimumDepartureTime) {
        break;
      }

      this.discoverConnection(connection);
      const earliestArrivalTime = this.calculateEarliestArrivalTime(connection);

      this.updateEarliestArrivalByTrip(connection, earliestArrivalTime);

      if (!this.isDominated(connection, earliestArrivalTime)) {
        this.getFootpathsForDepartureStop(connection, earliestArrivalTime);
      }
    }

    return await this.journeyExtractor.extractJourneys(
      this.profilesByStop,
      this.query,
    );
  }

  private discoverConnection(connection: IConnection) {
    [connection.departureStop, connection.arrivalStop].forEach((stop) => {
      if (!this.profilesByStop[stop]) {
        this.profilesByStop[stop] = [new Profile(this.maxLegs)];
      }
    });

    if (!this.earliestArrivalByTrip[connection["gtfs:trip"]]) {
      this.earliestArrivalByTrip[connection["gtfs:trip"]] = Array(this.maxLegs).fill(new EarliestArrival());
    }
  }

  private calculateEarliestArrivalTime(connection: IConnection): IArrivalTimeByTransfers {
    const t1 = this.walkToTarget(connection);
    const t2 = this.remainSeated(connection);
    const t3 = this.takeTransfer(connection);

    return minVector(t1, t2, t3);
  }

  private walkToTarget(connection: IConnection): IArrivalTimeByTransfers {
    let walkingTimeToTarget = this.D[connection.arrivalStop]; // TODO get duration.

    if (connection.arrivalStop === this.query.to[0].id) { // not needed.
      walkingTimeToTarget = 0;
    }

    if (walkingTimeToTarget === undefined) {
      return Array(this.maxLegs).fill(Infinity);
    }

    return Array(this.maxLegs).fill(connection.arrivalTime.getTime() + walkingTimeToTarget);
  }

  private remainSeated(connection: IConnection): IArrivalTimeByTransfers {
    return this.earliestArrivalByTrip[connection["gtfs:trip"]].map((trip) => trip.arrivalTime);
  }

  private takeTransfer(connection: IConnection): IArrivalTimeByTransfers {
    return shiftVector(evalProfile(this.profilesByStop, connection, this.maxLegs));
  }

  private updateEarliestArrivalByTrip(
    connection: IConnection,
    currentArrivalTimeByTransfers: IArrivalTimeByTransfers,
  ): void {
    const earliestArrivalByTransfers: IEarliestArrival[] = this.earliestArrivalByTrip[connection["gtfs:trip"]];

    this.earliestArrivalByTrip[connection["gtfs:trip"]] = earliestArrivalByTransfers.map((earliestArrival, transfer) =>
      currentArrivalTimeByTransfers[transfer] < earliestArrival.arrivalTime ?
        { connection, arrivalTime: currentArrivalTimeByTransfers[transfer] } :
        earliestArrival,
    );
  }

  private isDominated(connection: IConnection, currentArrivalTimeByTransfers: IArrivalTimeByTransfers): boolean {
    const depProfile = this.profilesByStop[connection.departureStop];
    const earliestProfileEntry = depProfile[depProfile.length - 1];

    return earliestProfileEntry.arrivalTimes.reduce((memo, arrivalTime, transfer) =>
      memo && arrivalTime <= currentArrivalTimeByTransfers[transfer], true);
  }

  private getFootpathsForDepartureStop(
    connection: IConnection,
    currentArrivalTimeByTransfers: IArrivalTimeByTransfers,
  ): void {
    const depProfile: Profile[] = this.profilesByStop[connection.departureStop];
    const earliestProfileEntry = depProfile[depProfile.length - 1];
    const minVectorTimes = minVector(currentArrivalTimeByTransfers, earliestProfileEntry.arrivalTimes);

    // For all footpaths with f_arr_stop = c_dep_stop
    // TODO getInterstopDistance
    const ISDs = [{ stop1: connection.departureStop, stop2: connection.departureStop, duration: 60000 }];
    ISDs.forEach((ISD) => {
      // stop is f_dep_stop, the stop of the ISD that is _not_ connection.dep.stop
      let stop = ISD.stop1;
      if (stop === connection.departureStop) {
        stop = ISD.stop2;
      }

      // Incorporate (c_dep_time - f_dur, t_c) into profile of S[f_dep_stop]
      this.incorporateInProfile(connection, ISD.duration, stop, minVectorTimes);
    });
  }

  private incorporateInProfile(
    connection: IConnection,
    duration: number,
    stop: string,
    minVectorTimes: IArrivalTimeByTransfers,
  ) {
    let profilesByDepartureStop = this.profilesByStop[stop];

    if (profilesByDepartureStop === undefined) {
      profilesByDepartureStop = this.profilesByStop[stop] = [new Profile(this.maxLegs)];
    }
    const earliestDepTimeProfile = profilesByDepartureStop[profilesByDepartureStop.length - 1];

    // If arrival times for all numbers of legs are equal to the earliest entry, this
    // entry is redundant
    let redundant = true;
    for (let i = 0; i < this.maxLegs; i++) {
      redundant = redundant && minVectorTimes[i] >= earliestDepTimeProfile.arrivalTimes[i];
    }

    if (!redundant) {
      const enterConnections = [];
      const exitConnections = [];

      for (let transfers = 0; transfers < this.maxLegs; transfers++) {
        // If the new arrival time is better, update journey pointers
        // Else, keep old journey pointers
        if (minVectorTimes[transfers] < earliestDepTimeProfile.arrivalTimes[transfers]) {
          enterConnections[transfers] = connection;
          exitConnections[transfers] = this.earliestArrivalByTrip[connection["gtfs:trip"]][transfers].connection;
          if (exitConnections[transfers] === null) {
            // This means the exit connection is the enter connection,
            // and tripStructure[connection.tripId] hasn't been initialized properly yet.
            exitConnections[transfers] = connection;
          }
        } else {
          enterConnections[transfers] = earliestDepTimeProfile.enterConnections[transfers];
          exitConnections[transfers] = earliestDepTimeProfile.exitConnections[transfers];
        }
      }

      // If the new departure time is equal, update the profile entry
      // Else, insert a new entry
      const departureTime = connection.departureTime.getTime() - duration; // Calculate c_dep_time - f_dur
      const newProfile = {
        departureTime,
        arrivalTimes: minVectorTimes,
        enterConnections,
        exitConnections,
      };

      if (earliestDepTimeProfile.departureTime !== departureTime) {
        profilesByDepartureStop.push(newProfile);
      } else {
        profilesByDepartureStop[profilesByDepartureStop.length - 1] = newProfile;
      }
    }
  }

}
