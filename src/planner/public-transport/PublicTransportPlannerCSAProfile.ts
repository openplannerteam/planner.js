import { inject, injectable } from "inversify";
import IConnection from "../../fetcher/connections/IConnection";
import IConnectionsFetcher from "../../fetcher/connections/IConnectionsFetcher";
import IPath from "../../interfaces/IPath";
import ILocationResolver from "../../query-runner/ILocationResolver";
import IResolvedQuery from "../../query-runner/IResolvedQuery";
import TYPES from "../../types";
import IRoadPlanner from "../road/IRoadPlanner";
import IEarliestArrival from "./CSA/dataStructure/EarliestArrival";
import EarliestArrival from "./CSA/dataStructure/EarliestArrival";
import IEarliestArrivalByTrip from "./CSA/dataStructure/IEarliestArrivalByTrip";
import IProfilesByStop from "./CSA/dataStructure/IProfilesByStop";
import Profile from "./CSA/dataStructure/Profile";
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

    const upperBoundDate = new Date();
    upperBoundDate.setHours(upperBoundDate.getHours() + 2 );

    this.connectionsFetcher.setConfig({
      backward: true,
      upperBoundDate, // TODO what's the upperBoundDate.
    });
  }

  public async plan(query: IResolvedQuery): Promise<IPath[]> {
    return await this.calculateJourneys(query);
  }

  private async calculateJourneys(query: IResolvedQuery): Promise<IPath[]> {
    this.query = query;
    const earliestDepartureTime = new Date();

    for await (const connection of this.connectionsFetcher) {
      if (connection.departureTime < earliestDepartureTime) {
        break;
      }

      this.discoverConnection(connection);
      const earliestArrivalTime = this.calculateEarliestArrivalTime(connection);

      this.updateEarliestArrivalByTrip(connection, earliestArrivalTime);

      if (!this.isDominated(connection, earliestArrivalTime)) {
        this.incorporateForFootpaths(connection, earliestArrivalTime);
      }
    }

    return await this.journeyExtractor.extractJourneys(
      this.profilesByStop,
      query.from[0],
      query.to[0],
      earliestDepartureTime,
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

  private calculateEarliestArrivalTime(connection: IConnection): number[] {
    const t1 = this.walkToTarget(connection);
    const t2 = this.remainSeated(connection);
    const t3 = this.takeTransfer(connection);

    return minVector(t1, t2, t3);
  }

  private walkToTarget(connection: IConnection): number[] {
    let walkingTimeToTarget = this.D[connection.arrivalStop]; // TODO get duration.

    if (connection.arrivalStop === this.query.to[0].id) { // not needed.
      walkingTimeToTarget = 0;
    }

    if (walkingTimeToTarget === undefined) {
      return Array(this.maxLegs).fill(Infinity);
    }

    return Array(this.maxLegs).fill(connection.arrivalTime.getTime() + walkingTimeToTarget);
  }

  private remainSeated(connection: IConnection): number[] {
    return this.earliestArrivalByTrip[connection["gtfs:trip"]].map((trip) => trip.arrivalTime);
  }

  private takeTransfer(connection: IConnection): number[] {
    return shiftVector(evalProfile(this.profilesByStop, connection, this.maxLegs));
  }

  private updateEarliestArrivalByTrip(connection: IConnection, currentArrivalTimeByTransfers: number[]): void {
    const earliestArrivalByTransfers: IEarliestArrival[] = this.earliestArrivalByTrip[connection["gtfs:trip"]];

    this.earliestArrivalByTrip[connection["gtfs:trip"]] = earliestArrivalByTransfers.map(
      (earliestArrival, transfer) => {
        if (currentArrivalTimeByTransfers[transfer] < earliestArrival.arrivalTime) {
          return {connection, arrivalTime: currentArrivalTimeByTransfers[transfer]};
        }
        return earliestArrival;
    });
  }

  private isDominated(connection: IConnection, currentArrivalTimeByTransfers: number[]): boolean {
    const depProfile = this.profilesByStop[connection.departureStop];
    const earliestProfileEntry = depProfile[depProfile.length - 1];

    return earliestProfileEntry.arrivalTimes.reduce((memo, arrivalTime, transfer) =>
      memo && arrivalTime <= currentArrivalTimeByTransfers[transfer]
    , true);
  }

  private incorporateForFootpaths(connection: IConnection, currentArrivalTimeByTransfers: number[]): void  {
    const depProfile: Profile[] = this.profilesByStop[connection.departureStop];
    const earliestProfileEntry = depProfile[depProfile.length - 1];
    const minVectorTimes = minVector(currentArrivalTimeByTransfers, earliestProfileEntry.arrivalTimes);

    // For all footpaths with f_arr_stop = c_dep_stop
    // TODO getInterstopDistance
    const ISDs = [{stop1: connection.departureStop, stop2: connection.departureStop, duration: 60000}];
    ISDs.forEach((ISD) => {
      // stop is f_dep_stop, the stop of the ISD that is _not_ connection.dep.stop
      let stop = ISD.stop1;
      if (stop === connection.departureStop) {
        stop = ISD.stop2;
      }

      // Incorporate (c_dep_time - f_dur, t_c) into profile of S[f_dep_stop]
      this.incorporateInProfile(connection, ISD, stop, minVectorTimes);
    });
  }

  private incorporateInProfile(connection: IConnection, ISD, stop: string, minVectorTimes: number[]) {
    let ISDDepProfile = this.profilesByStop[stop]; // S[f_dep_stop]
    // S[f_dep_stop] might be undefined (open world), in that case initialize its profile entry
    if (ISDDepProfile === undefined) {
      ISDDepProfile = this.profilesByStop[stop] = [new Profile(this.maxLegs)];
    }
    const ISDDepEarliestEntry = ISDDepProfile[ISDDepProfile.length - 1]; // earliest dep time
    // Enter and exit connections are journey pointers
    const enterConnections = [];
    const exitConnections = [];

    // For each amount of legs
    for (let i = 0; i < this.maxLegs; i++) {
      // If the new arrival time is better, update journey pointers
      // Else, keep old journey pointers
      if (minVectorTimes[i] < ISDDepEarliestEntry.arrivalTimes[i]) {
        enterConnections[i] = connection;
        exitConnections[i] = this.earliestArrivalByTrip[connection["gtfs:trip"]][i].connection;
        if (exitConnections[i] === null) {
          // This means the exit connection is the enter connection,
          // and tripStructure[connection.tripId] hasn't been initialized properly yet.
          exitConnections[i] = connection;
        }
      } else {
        enterConnections[i] = ISDDepEarliestEntry.enterConnections[i];
        exitConnections[i] = ISDDepEarliestEntry.exitConnections[i];
      }
    }

    // If arrival times for all numbers of legs are equal to the earliest entry, this
    // entry is redundant
    let redundant = true;
    for (let i = 0; i < this.maxLegs; i++) {
      redundant = redundant && minVectorTimes[i] >= ISDDepEarliestEntry.arrivalTimes[i];
    }

    if (!redundant) {
      // If the new departure time is equal, update the profile entry
      // Else, insert a new entry
      const departureTime = connection.departureTime.getTime() - ISD.duration; // Calculate c_dep_time - f_dur
      const entry = {
        departureTime,
        arrivalTimes: minVectorTimes,
        enterConnections,
        exitConnections,
      };

      if (ISDDepEarliestEntry.departureTime !== departureTime) {
        ISDDepProfile.push(entry);
      } else {
        ISDDepProfile[ISDDepProfile.length - 1] = entry;
      }
    }
  }

}
