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
import IArrivalTimeByTransfers from "./CSA/data-structure/IArrivalTimeByTransfers";
import IProfilesByStop from "./CSA/data-structure/stops/IProfilesByStop";
import ITransferProfile from "./CSA/data-structure/stops/ITransferProfile";
import Profile from "./CSA/data-structure/stops/Profile";
import EarliestArrivalByTransfers from "./CSA/data-structure/trips/EarliestArrivalByTransfers";
import IEarliestArrivalByTransfers from "./CSA/data-structure/trips/IEarliestArrivalByTransfers";
import IEarliestArrivalByTrip from "./CSA/data-structure/trips/IEarliestArrivalByTrip";
import JourneyExtractor from "./CSA/JourneyExtractor";
import ProfileUtil from "./CSA/util/ProfileUtil";
import IPublicTransportPlanner from "./IPublicTransportPlanner";

/**
 * An implementation of the Connection Scan Algorithm (SCA).
 *
 * @implements [[IPublicTransportPlanner]]
 * @property profilesByStop Describes the CSA profiles for each scanned stop.
 * @property earliestArrivalByTrip Describes the earliest arrival time for each scanned trip.
 * @property durationToTargetByStop Describes the walking duration to the target stop for a scanned stop.
 *
 * @returns multiple [[IPath]]s that consist of several [[IStep]]s.
 */
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

    this.journeyExtractor = new JourneyExtractor(roadPlanner, locationResolver, reachableStopsFinder);
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
        this.profilesByStop[stop] = [Profile.create(this.query.maximumTransfers)];
      }
    });

    if (!this.earliestArrivalByTrip[connection["gtfs:trip"]]) {
      this.earliestArrivalByTrip[connection["gtfs:trip"]] = EarliestArrivalByTransfers.create(
        this.query.maximumTransfers,
      );
    }
  }

  private calculateEarliestArrivalTime(connection: IConnection): IArrivalTimeByTransfers {
    const t1 = this.walkToTarget(connection);
    const t2 = this.remainSeated(connection);
    const t3 = this.takeTransfer(connection);

    return Vectors.minVector(t1, t2, t3);
  }

  private async initDurationToTargetByStop(): Promise<void> {
    const arrivalStop: IStop = this.query.to[0] as IStop;

    const reachableStops = await this.reachableStopsFinder.findReachableStops(
      arrivalStop,
      this.query.maximumTransferDuration,
      this.query.minimumWalkingSpeed,
    );

    for (const reachableStop of reachableStops) {
      this.durationToTargetByStop[reachableStop.stop.id] = reachableStop.duration;
    }
  }

  private walkToTarget(connection: IConnection): IArrivalTimeByTransfers {
    const walkingTimeToTarget = this.durationToTargetByStop[connection.arrivalStop];

    if (walkingTimeToTarget === undefined) {
      return Array(this.query.maximumTransfers).fill(Infinity);
    }

    return Array(this.query.maximumTransfers).fill(connection.arrivalTime.getTime() + walkingTimeToTarget);
  }

  private remainSeated(connection: IConnection): IArrivalTimeByTransfers {
    return this.earliestArrivalByTrip[connection["gtfs:trip"]].map((transfer) =>
      transfer.arrivalTime,
    );
  }

  private takeTransfer(connection: IConnection): IArrivalTimeByTransfers {
    if (connection["gtfs:dropOffType"] === "gtfs:NotAvailable") {
      return Array(this.query.maximumTransfers).fill(Infinity);
    }

    return Vectors.shiftVector<IArrivalTimeByTransfers>(
      ProfileUtil.getTransferTimes(this.profilesByStop, connection, this.query.maximumTransfers),
    );
  }

  private updateEarliestArrivalByTrip(
    connection: IConnection,
    arrivalTimeByTransfers: IArrivalTimeByTransfers,
  ): void {
    const earliestArrivalByTransfers: IEarliestArrivalByTransfers = this.earliestArrivalByTrip[connection["gtfs:trip"]];

    this.earliestArrivalByTrip[connection["gtfs:trip"]] = EarliestArrivalByTransfers.createByConnection(
      earliestArrivalByTransfers,
      connection,
      arrivalTimeByTransfers,
    );
  }

  private isDominated(connection: IConnection, arrivalTimeByTransfers: IArrivalTimeByTransfers): boolean {
    const departureProfile = this.profilesByStop[connection.departureStop];
    const earliestProfileEntry = departureProfile[departureProfile.length - 1];

    return earliestProfileEntry.isDominated(arrivalTimeByTransfers);
  }

  private async getFootpathsForDepartureStop(
    connection: IConnection,
    currentArrivalTimeByTransfers: IArrivalTimeByTransfers,
  ): Promise<void> {
    const depProfile: Profile[] = this.profilesByStop[connection.departureStop];
    const earliestProfileEntry = depProfile[depProfile.length - 1];

    const earliestArrivalTimeByTransfers = Vectors.minVector(
      currentArrivalTimeByTransfers,
      earliestProfileEntry.getArrivalTimeByTransfers(),
    );

    const departureStop = await this.locationResolver.resolve(connection.departureStop);
    const reachableStops = await this.reachableStopsFinder.findReachableStops(
      departureStop as IStop,
      this.query.maximumTransferDuration,
      this.query.minimumWalkingSpeed,
    );

    reachableStops.forEach((reachableStop) => {
      // Incorporate (c_dep_time - f_dur, t_c) into profile of S[f_dep_stop]
      this.incorporateInProfile(connection, reachableStop.duration, reachableStop.stop, earliestArrivalTimeByTransfers);
    });
  }

  private incorporateInProfile(
    connection: IConnection,
    duration: DurationMs,
    stop: IStop,
    arrivalTimeByTransfers: IArrivalTimeByTransfers,
  ) {
    let profilesByDepartureStop = this.profilesByStop[stop.id];

    if (!profilesByDepartureStop) {
      profilesByDepartureStop = this.profilesByStop[stop.id] = [Profile.create(this.query.maximumTransfers)];
    }
    const earliestDepTimeProfile = profilesByDepartureStop[profilesByDepartureStop.length - 1];

    // If arrival times for all numbers of legs are equal to the earliest entry, this
    // entry is redundant

    if (!earliestDepTimeProfile.isDominated(arrivalTimeByTransfers)) {
      const currentTransferProfiles = earliestDepTimeProfile.transferProfiles;
      const transferProfiles = [];

      for (let amountOfTransfers = 0; amountOfTransfers < currentTransferProfiles.length; amountOfTransfers++) {
        const transferProfile: ITransferProfile = currentTransferProfiles[amountOfTransfers];

        const newTransferProfile: ITransferProfile = {
          exitConnection: undefined,
          enterConnection: undefined,
          arrivalTime: Infinity,
        };

        const possibleExitConnection = this.earliestArrivalByTrip[connection["gtfs:trip"]]
          [amountOfTransfers].connection || connection;

        if (
          arrivalTimeByTransfers[amountOfTransfers] < transferProfile.arrivalTime &&
          connection["gtfs:pickupType"] !== "gtfs:NotAvailable" &&
          possibleExitConnection["gtfs:dropOfType"] !== "gtfs:NotAvailable"
        ) {
            newTransferProfile.enterConnection = connection;
            newTransferProfile.exitConnection = possibleExitConnection;
        } else {
          newTransferProfile.enterConnection = transferProfile.enterConnection;
          newTransferProfile.exitConnection = transferProfile.exitConnection;
        }

        if (newTransferProfile.exitConnection && newTransferProfile.enterConnection) {
          newTransferProfile.arrivalTime = arrivalTimeByTransfers[amountOfTransfers];
        }

        transferProfiles.push(newTransferProfile);
      }

      // If the new departure time is equal, update the profile entry
      // Else, insert a new entry
      const departureTime = connection.departureTime.getTime() - duration;
      const newProfile: Profile = Profile.createFromTransfers(departureTime, transferProfiles);

      let i = profilesByDepartureStop.length - 1;
      let earliestProfile = profilesByDepartureStop[i];

      if (earliestProfile.departureTime === Infinity) {
        profilesByDepartureStop[i] = newProfile;
      } else {
        while (i > 0 && earliestProfile.departureTime < departureTime) {
          profilesByDepartureStop[i + 1] = earliestProfile;
          i--;
          earliestProfile = profilesByDepartureStop[i];
        }
        profilesByDepartureStop[i + 1] = newProfile;
      }
    }
  }

}
