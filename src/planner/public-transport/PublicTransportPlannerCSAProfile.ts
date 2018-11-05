import { inject, injectable } from "inversify";
import IConnection from "../../fetcher/connections/IConnection";
import IConnectionsFetcher from "../../fetcher/connections/IConnectionsFetcher";
import IStop from "../../fetcher/stops/IStop";
import IPath from "../../interfaces/IPath";
import ILocationResolver from "../../query-runner/ILocationResolver";
import IResolvedQuery from "../../query-runner/IResolvedQuery";
import TYPES from "../../types";
import IRoadPlanner from "../road/IRoadPlanner";
import IReachableStopsFinder from "../stops/IReachableStopsFinder";
import EarliestArrival from "./CSA/data-structure/EarliestArrival";
import IEarliestArrival from "./CSA/data-structure/EarliestArrival";
import IArrivalTimeByTransfers from "./CSA/data-structure/IArrivalTimeByTransfers";
import IEarliestArrivalByTrip from "./CSA/data-structure/IEarliestArrivalByTrip";
import IProfilesByStop from "./CSA/data-structure/IProfilesByStop";
import Profile from "./CSA/data-structure/Profile";
import JourneyExtractor from "./CSA/JourneyExtractor";
import { evalProfile, minVector, shiftVector } from "./CSA/util/vectors";
import IPublicTransportPlanner from "./IPublicTransportPlanner";

@injectable()
export default class PublicTransportPlannerCSAProfile implements IPublicTransportPlanner {
  private readonly connectionsFetcher: IConnectionsFetcher;
  private readonly roadPlanner: IRoadPlanner;
  private readonly locationResolver: ILocationResolver;
  private readonly reachableStopsFinder: IReachableStopsFinder;

  private readonly journeyExtractor: JourneyExtractor;

  private profilesByStop: IProfilesByStop = {}; // S
  private earliestArrivalByTrip: IEarliestArrivalByTrip = {}; // T
  private durationToTargetByStop: number[] = [];

  private maxLegs: number = 8; // TODO define max legs on query?
  private maximumDuration: number = 0.4; // TODO define maximum duration (radius) on query?

  private query: IResolvedQuery;

  constructor(
    @inject(TYPES.ConnectionsFetcher) connectionsFetcher: IConnectionsFetcher,
    @inject(TYPES.RoadPlanner) roadPlanner: IRoadPlanner,
    @inject(TYPES.LocationResolver) locationResolver: ILocationResolver,
    @inject(TYPES.ReachableStopsFinder) reachableStopsFinder: IReachableStopsFinder,
  ) {
    this.connectionsFetcher = connectionsFetcher;
    this.roadPlanner = roadPlanner;
    this.locationResolver = locationResolver;
    this.reachableStopsFinder = reachableStopsFinder;

    this.journeyExtractor = new JourneyExtractor(roadPlanner, locationResolver);
  }

  public async plan(query: IResolvedQuery): Promise<IPath[]> {
    this.query = query;

    query.minimumWalkingSpeed = query.minimumWalkingSpeed || 3;
    query.maximumWalkingSpeed = query.maximumWalkingSpeed || 6;
    this.maximumDuration = 1;

    this.setBounds();

    return await this.calculateJourneys();
  }

  private setBounds() {
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
    await this.initDurationToTargetByStop();

    for await (const connection of this.connectionsFetcher) {
      if (connection.departureTime < this.query.minimumDepartureTime) {
        break;
      }

      this.discoverConnection(connection);
      const earliestArrivalTime = this.calculateEarliestArrivalTime(connection);

      this.updateEarliestArrivalByTrip(connection, earliestArrivalTime);

      if (!this.isDominated(connection, earliestArrivalTime)) {
        await this.getFootpathsForDepartureStop(connection, earliestArrivalTime);
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

  private async initDurationToTargetByStop(): Promise<void> {
    for (const arrivalStop of this.query.to) {
      const reachableStops = await this.reachableStopsFinder.findReachableStops(
        arrivalStop as IStop,
        this.maximumDuration,
        this.query.minimumWalkingSpeed,
      );

      for (const stop of reachableStops) {
        this.durationToTargetByStop[stop[0].id] = stop[1] * 3600000;
      }
    }
  }

  private walkToTarget(connection: IConnection): IArrivalTimeByTransfers {
    const walkingTimeToTarget = this.durationToTargetByStop[connection.arrivalStop];

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

  private async getFootpathsForDepartureStop(
    connection: IConnection,
    currentArrivalTimeByTransfers: IArrivalTimeByTransfers,
  ): Promise<void> {
    const depProfile: Profile[] = this.profilesByStop[connection.departureStop];
    const earliestProfileEntry = depProfile[depProfile.length - 1];
    const minVectorTimes = minVector(currentArrivalTimeByTransfers, earliestProfileEntry.arrivalTimes);

    const departureStop = await this.locationResolver.resolve(connection.departureStop);
    const reachableStops = await this.reachableStopsFinder.findReachableStops(
      departureStop as IStop,
      this.maximumDuration,
      this.query.minimumWalkingSpeed,
    );

    reachableStops.forEach((reachableStop) => {
      const duration = reachableStop[1] * 3600000; // TODO use util function
      // Incorporate (c_dep_time - f_dur, t_c) into profile of S[f_dep_stop]
      this.incorporateInProfile(connection, duration, reachableStop[0], minVectorTimes);
    });
  }

  private incorporateInProfile(
    connection: IConnection,
    duration: number,
    stop: IStop,
    minVectorTimes: IArrivalTimeByTransfers,
  ) {
    let profilesByDepartureStop = this.profilesByStop[stop.id];

    if (profilesByDepartureStop === undefined) {
      profilesByDepartureStop = this.profilesByStop[stop.id] = [new Profile(this.maxLegs)];
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
