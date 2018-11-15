import { inject, injectable } from "inversify";
import IConnection from "../../fetcher/connections/IConnection";
import IConnectionsFetcher from "../../fetcher/connections/IConnectionsFetcher";
import IStop from "../../fetcher/stops/IStop";
import IPath from "../../interfaces/IPath";
import { DurationMs } from "../../interfaces/units";
import ILocationResolver from "../../query-runner/ILocationResolver";
import IResolvedQuery from "../../query-runner/IResolvedQuery";
import TYPES from "../../types";
import Vectors from "../../util/Vectors";
import IRoadPlanner from "../road/IRoadPlanner";
import IReachableStopsFinder from "../stops/IReachableStopsFinder";
import IEarliestArrival from "./CSA/data-structure/EarliestArrival";
import EarliestArrival from "./CSA/data-structure/EarliestArrival";
import IArrivalTimeByTransfers from "./CSA/data-structure/IArrivalTimeByTransfers";
import IEarliestArrivalByTrip from "./CSA/data-structure/IEarliestArrivalByTrip";
import IProfilesByStop from "./CSA/data-structure/IProfilesByStop";
import Profile from "./CSA/data-structure/Profile";
import JourneyExtractor from "./CSA/JourneyExtractor";
import ProfileUtil from "./CSA/util/ProfileUtil";
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
  private durationToTargetByStop: DurationMs[] = [];

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
    this.setBounds();

    return await this.calculateJourneys();
  }

  private setBounds() {
    let upperBoundDate;
    let lowerBoundDate;

    if (this.query.minimumDepartureTime) {
      lowerBoundDate = this.query.minimumDepartureTime;
    } else {
      lowerBoundDate = new Date();
    }

    if (this.query.maximumArrivalTime) {
      upperBoundDate = this.query.maximumArrivalTime;
    } else {
      upperBoundDate = new Date(lowerBoundDate);
      upperBoundDate.setHours(upperBoundDate.getHours() + 2);
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
        this.profilesByStop[stop] = [new Profile(this.query.maximumLegs)];
      }
    });

    if (!this.earliestArrivalByTrip[connection.gtfsTripId]) {
      this.earliestArrivalByTrip[connection.gtfsTripId] = Array(this.query.maximumLegs).fill(new EarliestArrival());
    }
  }

  private calculateEarliestArrivalTime(connection: IConnection): IArrivalTimeByTransfers {
    const t1 = this.walkToTarget(connection);
    const t2 = this.remainSeated(connection);
    const t3 = this.takeTransfer(connection);

    return Vectors.minVector(t1, t2, t3);
  }

  private async initDurationToTargetByStop(): Promise<void> {
    for (const arrivalStop of this.query.to) {
      const reachableStops = await this.reachableStopsFinder.findReachableStops(
        arrivalStop as IStop,
        this.query.maximumTransferDuration,
        this.query.minimumWalkingSpeed,
      );

      for (const reachableStop of reachableStops) {
        this.durationToTargetByStop[reachableStop.stop.id] = reachableStop.duration;
      }
    }
  }

  private walkToTarget(connection: IConnection): IArrivalTimeByTransfers {
    const walkingTimeToTarget = this.durationToTargetByStop[connection.arrivalStop];

    if (walkingTimeToTarget === undefined) {
      return Array(this.query.maximumLegs).fill(Infinity);
    }

    return Array(this.query.maximumLegs).fill(connection.arrivalTime.getTime() + walkingTimeToTarget);
  }

  private remainSeated(connection: IConnection): IArrivalTimeByTransfers {
    return this.earliestArrivalByTrip[connection.gtfsTripId].map((trip) => trip.arrivalTime);
  }

  private takeTransfer(connection: IConnection): IArrivalTimeByTransfers {
    return Vectors.shiftVector<IArrivalTimeByTransfers>(
      ProfileUtil.evalProfile(this.profilesByStop, connection, this.query.maximumLegs),
    );
  }

  private updateEarliestArrivalByTrip(
    connection: IConnection,
    currentArrivalTimeByTransfers: IArrivalTimeByTransfers,
  ): void {
    const earliestArrivalByTransfers: IEarliestArrival[] = this.earliestArrivalByTrip[connection.gtfsTripId];

    this.earliestArrivalByTrip[connection.gtfsTripId] = earliestArrivalByTransfers.map((earliestArrival, transfer) =>
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
    const minVectorTimes = Vectors.minVector(currentArrivalTimeByTransfers, earliestProfileEntry.arrivalTimes);

    const departureStop = await this.locationResolver.resolve(connection.departureStop);
    const reachableStops = await this.reachableStopsFinder.findReachableStops(
      departureStop as IStop,
      this.query.maximumTransferDuration,
      this.query.minimumWalkingSpeed,
    );

    reachableStops.forEach((reachableStop) => {
      // Incorporate (c_dep_time - f_dur, t_c) into profile of S[f_dep_stop]
      this.incorporateInProfile(connection, reachableStop.duration, reachableStop.stop, minVectorTimes);
    });
  }

  private incorporateInProfile(
    connection: IConnection,
    duration: DurationMs,
    stop: IStop,
    minVectorTimes: IArrivalTimeByTransfers,
  ) {
    let profilesByDepartureStop = this.profilesByStop[stop.id];

    if (profilesByDepartureStop === undefined) {
      profilesByDepartureStop = this.profilesByStop[stop.id] = [new Profile(this.query.maximumLegs)];
    }
    const earliestDepTimeProfile = profilesByDepartureStop[profilesByDepartureStop.length - 1];

    // If arrival times for all numbers of legs are equal to the earliest entry, this
    // entry is redundant
    let redundant = true;
    for (let i = 0; i < this.query.maximumLegs; i++) {
      redundant = redundant && minVectorTimes[i] >= earliestDepTimeProfile.arrivalTimes[i];
    }

    if (!redundant) {
      const enterConnections = [];
      const exitConnections = [];

      for (let transfers = 0; transfers < this.query.maximumLegs; transfers++) {
        // If the new arrival time is better, update journey pointers
        // Else, keep old journey pointers
        if (minVectorTimes[transfers] < earliestDepTimeProfile.arrivalTimes[transfers]) {
          enterConnections[transfers] = connection;
          exitConnections[transfers] = this.earliestArrivalByTrip[connection.gtfsTripId][transfers].connection;
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
      const departureTime = connection.departureTime.getTime() - duration;
      const newProfile = {
        departureTime,
        arrivalTimes: minVectorTimes,
        enterConnections,
        exitConnections,
      };

      let i = profilesByDepartureStop.length - 1;
      let earliestProfile = profilesByDepartureStop[i];
      while (i > 0 && earliestProfile.departureTime < departureTime) {
        profilesByDepartureStop[i + 1] = earliestProfile;
        i--;
        earliestProfile = profilesByDepartureStop[i];
      }
      profilesByDepartureStop[i + 1] = newProfile;
    }
  }

}
