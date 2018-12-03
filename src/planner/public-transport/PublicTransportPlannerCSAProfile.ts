import { AsyncIterator } from "asynciterator";
import { inject, injectable, tagged } from "inversify";
import IConnection from "../../fetcher/connections/IConnection";
import IConnectionsProvider from "../../fetcher/connections/IConnectionsProvider";
import IStop from "../../fetcher/stops/IStop";
import IPath from "../../interfaces/IPath";
import { DurationMs } from "../../interfaces/units";
import ILocationResolver from "../../query-runner/ILocationResolver";
import IResolvedQuery from "../../query-runner/IResolvedQuery";
import TYPES from "../../types";
import Vectors from "../../util/Vectors";
import IReachableStopsFinder from "../stops/IReachableStopsFinder";
import ReachableStopsFinderMode from "../stops/ReachableStopsFinderMode";
import ReachableStopsSearchPhase from "../stops/ReachableStopsSearchPhase";
import IArrivalTimeByTransfers from "./CSA/data-structure/IArrivalTimeByTransfers";
import IProfilesByStop from "./CSA/data-structure/stops/IProfilesByStop";
import ITransferProfile from "./CSA/data-structure/stops/ITransferProfile";
import Profile from "./CSA/data-structure/stops/Profile";
import EarliestArrivalByTransfers from "./CSA/data-structure/trips/EarliestArrivalByTransfers";
import IEarliestArrivalByTransfers from "./CSA/data-structure/trips/IEarliestArrivalByTransfers";
import IEarliestArrivalByTrip from "./CSA/data-structure/trips/IEarliestArrivalByTrip";
import ProfileUtil from "./CSA/util/ProfileUtil";
import IJourneyExtractor from "./IJourneyExtractor";
import IPublicTransportPlanner from "./IPublicTransportPlanner";

/**
 * An implementation of the Connection Scan Algorithm (CSA).
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
  private readonly connectionsProvider: IConnectionsProvider;
  private readonly locationResolver: ILocationResolver;
  private readonly finalReachableStopsFinder: IReachableStopsFinder;
  private readonly transferReachableStopsFinder: IReachableStopsFinder;
  private readonly journeyExtractor: IJourneyExtractor;

  private profilesByStop: IProfilesByStop = {}; // S
  private earliestArrivalByTrip: IEarliestArrivalByTrip = {}; // T
  private durationToTargetByStop: DurationMs[] = [];
  private gtfsTripByConnection = {};

  private query: IResolvedQuery;
  private connectionsIterator: AsyncIterator<IConnection>;

  constructor(
    @inject(TYPES.ConnectionsProvider) connectionsProvider: IConnectionsProvider,
    @inject(TYPES.LocationResolver) locationResolver: ILocationResolver,
    @inject(TYPES.ReachableStopsFinder)
    @tagged("phase", ReachableStopsSearchPhase.Transfer)
      transferReachableStopsFinder: IReachableStopsFinder,
    @inject(TYPES.ReachableStopsFinder)
    @tagged("phase", ReachableStopsSearchPhase.Final)
      finalReachableStopsFinder: IReachableStopsFinder,
    @inject(TYPES.JourneyExtractor) journeyExtractor: IJourneyExtractor,
  ) {
    this.connectionsProvider = connectionsProvider;
    this.locationResolver = locationResolver;
    this.transferReachableStopsFinder = transferReachableStopsFinder;
    this.finalReachableStopsFinder = finalReachableStopsFinder;
    this.journeyExtractor = journeyExtractor;
  }

  public async plan(query: IResolvedQuery): Promise<AsyncIterator<IPath>> {
    this.query = query;
    this.setBounds();

    return this.calculateJourneys();
  }

  private setBounds() {
    const {
      minimumDepartureTime: lowerBoundDate,
      maximumArrivalTime: upperBoundDate,
    } = this.query;

    this.connectionsProvider.setConfig({
      backward: true,
      upperBoundDate,
      lowerBoundDate,
    });
  }

  private async calculateJourneys(): Promise<AsyncIterator<IPath>> {
    await this.initDurationToTargetByStop();

    this.connectionsIterator = this.connectionsProvider.createIterator();

    const self = this;

    return new Promise((resolve, reject) => {

      const done = () => {
        self.journeyExtractor.extractJourneys(self.profilesByStop, self.query)
          .then((resultIterator) => {
            resolve(resultIterator);
          });
      };

      this.connectionsIterator.on("readable", () =>
        self.processNextConnection(done),
      );

      this.connectionsIterator.on("end", () => done());

    }) as Promise<AsyncIterator<IPath>>;
  }

  private processNextConnection(done: () => void) {
    const connection = this.connectionsIterator.read();

    if (connection) {
      if (connection.arrivalTime > this.query.maximumArrivalTime) {
        this.maybeProcessNextConnection(done);
        return;
      }

      if (connection.departureTime < this.query.minimumDepartureTime) {
        this.connectionsIterator.close();
        done();
        return;
      }

      this.discoverConnection(connection);

      const earliestArrivalTime = this.calculateEarliestArrivalTime(connection);
      this.updateEarliestArrivalByTrip(connection, earliestArrivalTime);

      if (!this.isDominated(connection, earliestArrivalTime)) {
        this.getFootpathsForDepartureStop(connection, earliestArrivalTime)
          .then(() => this.maybeProcessNextConnection(done));

      } else {
        this.maybeProcessNextConnection(done);
      }
    }
  }

  private maybeProcessNextConnection(done: () => void) {
    if (!this.connectionsIterator.closed) {
      this.processNextConnection(done);
    }
  }

  private discoverConnection(connection: IConnection) {
    this.gtfsTripByConnection[connection.id] = connection["gtfs:trip"];

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

  private getTripIdsFromConnection(connection: IConnection): string[] {
    const tripIds = [connection["gtfs:trip"]];

    if (!connection.nextConnection) {
      return tripIds;
    }

    for (const connectionId of connection.nextConnection) {
      const tripId = this.gtfsTripByConnection[connectionId];
      if (tripIds.indexOf(tripId) === -1) {
        tripIds.push(this.gtfsTripByConnection[connectionId]);
      }
    }

    return tripIds;
  }

  private calculateEarliestArrivalTime(connection: IConnection): IArrivalTimeByTransfers {
    const remainSeatedTime = this.remainSeated(connection);
    if (connection["gtfs:dropOffType"] === "gtfs:NotAvailable") {
      return remainSeatedTime;
    }

    const walkToTargetTime = this.walkToTarget(connection);
    const takeTransferTime = this.takeTransfer(connection);

    return Vectors.minVector((c) => c.arrivalTime, walkToTargetTime, remainSeatedTime, takeTransferTime);
  }

  private async initDurationToTargetByStop(): Promise<void> {
    const arrivalStop: IStop = this.query.to[0] as IStop;

    const reachableStops = await this.finalReachableStopsFinder
      .findReachableStops(
        arrivalStop,
        ReachableStopsFinderMode.Target,
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
      return Array(this.query.maximumTransfers + 1).fill({
        "arrivalTime": Infinity,
        "gtfs:trip": connection["gtfs:trip"],
      });
    }

    return Array(this.query.maximumTransfers + 1).fill({
      "arrivalTime": connection.arrivalTime.getTime() + walkingTimeToTarget,
      "gtfs:trip": connection["gtfs:trip"],
    });
  }

  private remainSeated(connection: IConnection): IArrivalTimeByTransfers {
    const tripIds = this.getTripIdsFromConnection(connection);
    const earliestArrivalTimeByTransfers: IArrivalTimeByTransfers = [];

    for (let amountOfTransfers = 0; amountOfTransfers < this.query.maximumTransfers + 1; amountOfTransfers++) {
      const earliestArrivalTime = earliestArrivalTimeByTransfers[amountOfTransfers];
      let minimumArrivalTime = earliestArrivalTime && earliestArrivalTime.arrivalTime;

      for (const tripId of tripIds) {
        const tripArrivalTime = this.earliestArrivalByTrip[tripId][amountOfTransfers].arrivalTime;

        if (!minimumArrivalTime || tripArrivalTime < minimumArrivalTime) {
          earliestArrivalTimeByTransfers[amountOfTransfers] = {
            "arrivalTime": tripArrivalTime,
            "gtfs:trip": tripId,
          };
          minimumArrivalTime = tripArrivalTime;
        }
      }

    }

    return earliestArrivalTimeByTransfers;
  }

  private takeTransfer(connection: IConnection): IArrivalTimeByTransfers {
    return Vectors.shiftVector<IArrivalTimeByTransfers>(
      ProfileUtil.getTransferTimes(this.profilesByStop, connection, this.query.maximumTransfers),
      { "arrivalTime": Infinity, "gtfs:trip": connection["gtfs:trip"] },
    );
  }

  private updateEarliestArrivalByTrip(
    connection: IConnection,
    arrivalTimeByTransfers: IArrivalTimeByTransfers,
  ): void {
    const tripIds = this.getTripIdsFromConnection(connection);

    const earliestArrivalByTransfers: IEarliestArrivalByTransfers = arrivalTimeByTransfers.map(
      (arrivalTime, amountOfTransfers: number) => {
        const tripId: string = arrivalTime["gtfs:trip"];
        return this.earliestArrivalByTrip[tripId][amountOfTransfers];
      },
    );

    for (const tripId of tripIds) {
      this.earliestArrivalByTrip[tripId] = EarliestArrivalByTransfers.createByConnection(
        earliestArrivalByTransfers,
        connection,
        arrivalTimeByTransfers,
      );
    }
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
      (c) => c.arrivalTime,
      currentArrivalTimeByTransfers,
      earliestProfileEntry.getArrivalTimeByTransfers(),
    );

    const departureStop = await this.locationResolver.resolve(connection.departureStop);
    const reachableStops = await this.transferReachableStopsFinder.findReachableStops(
      departureStop as IStop,
      ReachableStopsFinderMode.Source,
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
          arrivalTimeByTransfers[amountOfTransfers].arrivalTime < transferProfile.arrivalTime &&
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
          newTransferProfile.arrivalTime = arrivalTimeByTransfers[amountOfTransfers].arrivalTime;
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
