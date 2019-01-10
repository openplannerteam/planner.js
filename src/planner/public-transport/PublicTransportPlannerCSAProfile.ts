import { AsyncIterator } from "asynciterator";
import { inject, injectable, tagged } from "inversify";
import Context from "../../Context";
import EventType from "../../EventType";
import DropOffType from "../../fetcher/connections/DropOffType";
import IConnection from "../../fetcher/connections/IConnection";
import IConnectionsProvider from "../../fetcher/connections/IConnectionsProvider";
import PickupType from "../../fetcher/connections/PickupType";
import IStop from "../../fetcher/stops/IStop";
import ILocation from "../../interfaces/ILocation";
import IPath from "../../interfaces/IPath";
import { DurationMs } from "../../interfaces/units";
import ILocationResolver from "../../query-runner/ILocationResolver";
import IResolvedQuery from "../../query-runner/IResolvedQuery";
import TYPES from "../../types";
import Vectors from "../../util/Vectors";
import IReachableStopsFinder, { IReachableStop } from "../stops/IReachableStopsFinder";
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
  private readonly initialReachableStopsFinder: IReachableStopsFinder;
  private readonly finalReachableStopsFinder: IReachableStopsFinder;
  private readonly transferReachableStopsFinder: IReachableStopsFinder;
  private readonly journeyExtractor: IJourneyExtractor;
  private readonly context: Context;

  private profilesByStop: IProfilesByStop = {}; // S
  private earliestArrivalByTrip: IEarliestArrivalByTrip = {}; // T
  private durationToTargetByStop: DurationMs[] = [];
  private gtfsTripByConnection = {};
  private initialReachableStops: IReachableStop[] = [];

  private query: IResolvedQuery;
  private connectionsIterator: AsyncIterator<IConnection>;

  constructor(
    @inject(TYPES.ConnectionsProvider)
      connectionsProvider: IConnectionsProvider,
    @inject(TYPES.LocationResolver)
      locationResolver: ILocationResolver,
    @inject(TYPES.ReachableStopsFinder)
    @tagged("phase", ReachableStopsSearchPhase.Initial)
      initialReachableStopsFinder: IReachableStopsFinder,
    @inject(TYPES.ReachableStopsFinder)
    @tagged("phase", ReachableStopsSearchPhase.Transfer)
      transferReachableStopsFinder: IReachableStopsFinder,
    @inject(TYPES.ReachableStopsFinder)
    @tagged("phase", ReachableStopsSearchPhase.Final)
      finalReachableStopsFinder: IReachableStopsFinder,
    @inject(TYPES.JourneyExtractor)
      journeyExtractor: IJourneyExtractor,
    @inject(TYPES.Context)
      context?: Context,
  ) {
    this.connectionsProvider = connectionsProvider;
    this.locationResolver = locationResolver;
    this.initialReachableStopsFinder = initialReachableStopsFinder;
    this.transferReachableStopsFinder = transferReachableStopsFinder;
    this.finalReachableStopsFinder = finalReachableStopsFinder;
    this.journeyExtractor = journeyExtractor;
    this.context = context;
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
    await this.initInitialReachableStops();

    this.connectionsIterator = this.connectionsProvider.createIterator();

    const self = this;

    return new Promise((resolve, reject) => {
      let isDone = false;
      const done = () => {
        if (!isDone) {
          self.connectionsIterator.close();

          self.journeyExtractor.extractJourneys(self.profilesByStop, self.query)
            .then((resultIterator) => {
              resolve(resultIterator);
            });
          isDone = true;
        }
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

      if (this.context) {
        this.context.emit(EventType.ConnectionScan, connection);
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
    if (connection["gtfs:dropOffType"] === DropOffType.NotAvailable) {
      return remainSeatedTime;
    }

    const walkToTargetTime = this.walkToTarget(connection);
    const takeTransferTime = this.takeTransfer(connection);

    return Vectors.minVector((c) => c.arrivalTime, walkToTargetTime, remainSeatedTime, takeTransferTime);
  }

  private async initDurationToTargetByStop(): Promise<boolean> {
    const arrivalStop: IStop = this.query.to[0] as IStop;

    const reachableStops = await this.finalReachableStopsFinder
      .findReachableStops(
        arrivalStop,
        ReachableStopsFinderMode.Target,
        this.query.maximumWalkingDuration,
        this.query.minimumWalkingSpeed,
      );

    if (reachableStops.length === 0 && this.context) {
      this.context.emit(EventType.AbortQuery, "No reachable stops at arrival location");

      return false;
    }

    if (this.context) {
      this.context.emit(EventType.FinalReachableStops, reachableStops);
    }

    for (const reachableStop of reachableStops) {
      if (!this.query.to[0].id && reachableStop.duration === 0) {
        this.query.to[0] = reachableStop.stop;
      }

      this.durationToTargetByStop[reachableStop.stop.id] = reachableStop.duration;
    }

    if (!this.query.to[0].id) {
      this.query.to[0].id = "geo:" + this.query.to[0].latitude + "," + this.query.to[0].longitude;
      this.query.to[0].name = "Arrival location";
    }

    return true;
  }

  private async initInitialReachableStops(): Promise<boolean> {
    const fromLocation: IStop = this.query.from[0] as IStop;

    this.initialReachableStops = await this.initialReachableStopsFinder.findReachableStops(
      fromLocation,
      ReachableStopsFinderMode.Source,
      this.query.maximumWalkingDuration,
      this.query.minimumWalkingSpeed,
    );

    const stopIndex = 0;
    while (stopIndex < this.initialReachableStops.length && !this.query.from[0].id) {
      const reachableStop = this.initialReachableStops[stopIndex];
      if (reachableStop.duration === 0) {
        this.query.from[0] = reachableStop.stop;
      }
    }

    if (!this.query.from[0].id) {
      this.query.from[0].id = "geo:" + this.query.from[0].latitude + "," + this.query.from[0].longitude;
      this.query.from[0].name = "Departure location";
    }

    if (this.initialReachableStops.length === 0 && this.context) {
      this.context.emit(EventType.AbortQuery, "No reachable stops at departure location");

      return false;
    }

    if (this.context) {
      this.context.emit(EventType.InitialReachableStops, this.initialReachableStops);
    }

    return true;
  }

  private walkToTarget(connection: IConnection): IArrivalTimeByTransfers {
    const walkingTimeToTarget = this.durationToTargetByStop[connection.arrivalStop];

    if (
      walkingTimeToTarget === undefined || connection["gtfs:dropOfType"] === "gtfs:NotAvailable" ||
      connection.arrivalTime.getTime() + walkingTimeToTarget > this.query.maximumArrivalTime.getTime()
    ) {
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

    const transferTimes: IArrivalTimeByTransfers = ProfileUtil.getTransferTimes(
      this.profilesByStop,
      connection,
      this.query.maximumTransfers,
      this.query.minimumTransferDuration,
      this.query.maximumTransferDuration,
    );

    return Vectors.shiftVector<IArrivalTimeByTransfers>(
      transferTimes,
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
    const departureLocation: IStop = this.query.from[0] as IStop;
    const depProfile: Profile[] = this.profilesByStop[connection.departureStop];
    const earliestProfileEntry: Profile = depProfile[depProfile.length - 1];

    const earliestArrivalTimeByTransfers: IArrivalTimeByTransfers = Vectors.minVector(
      (c) => c.arrivalTime,
      currentArrivalTimeByTransfers,
      earliestProfileEntry.getArrivalTimeByTransfers(),
    );

    const initialReachableStop: IReachableStop = this.initialReachableStops.find(
      (reachable: IReachableStop) =>
        reachable.stop.id === connection.departureStop,
    );

    if (initialReachableStop) {
      this.incorporateInProfile(
        connection,
        initialReachableStop.duration,
        departureLocation,
        earliestArrivalTimeByTransfers,
      );
    }

    try {
      const departureStop: ILocation = await this.locationResolver.resolve(connection.departureStop);
      const reachableStops: IReachableStop[] = await this.transferReachableStopsFinder.findReachableStops(
        departureStop as IStop,
        ReachableStopsFinderMode.Source,
        this.query.maximumWalkingDuration,
        this.query.minimumWalkingSpeed,
      );

      reachableStops.forEach((reachableStop: IReachableStop) => {
        if (reachableStop.stop.id !== departureLocation.id) {
          this.incorporateInProfile(
            connection,
            reachableStop.duration,
            reachableStop.stop,
            earliestArrivalTimeByTransfers,
          );
        }
      });

    } catch (e) {
      this.context.emitWarning(e);
    }
  }

  private async emitTransferProfile(transferProfile: ITransferProfile, amountOfTransfers: number): Promise<void> {
    try {
      const departureStop = await this.locationResolver.resolve(transferProfile.enterConnection.departureStop);
      const arrivalStop = await this.locationResolver.resolve(transferProfile.exitConnection.arrivalStop);

      this.context.emit(EventType.AddedNewTransferProfile, {
        departureStop,
        arrivalStop,
        amountOfTransfers,
      });

    } catch (e) {
      this.context.emitWarning(e);
    }
  }

  private incorporateInProfile(
    connection: IConnection,
    duration: DurationMs,
    stop: IStop,
    arrivalTimeByTransfers: IArrivalTimeByTransfers,
  ): void {
    const departureTime = connection.departureTime.getTime() - duration;

    if (departureTime < this.query.minimumDepartureTime.getTime()) {
      return;
    }

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
          departureTime: Infinity,
        };

        const possibleExitConnection = this.earliestArrivalByTrip[connection["gtfs:trip"]]
          [amountOfTransfers].connection || connection;

        if (
          arrivalTimeByTransfers[amountOfTransfers].arrivalTime < transferProfile.arrivalTime &&
          connection["gtfs:pickupType"] !== PickupType.NotAvailable &&
          possibleExitConnection["gtfs:dropOfType"] !== DropOffType.NotAvailable
        ) {
          newTransferProfile.enterConnection = connection;
          newTransferProfile.exitConnection = possibleExitConnection;
          newTransferProfile.departureTime = departureTime;

          if (this.context && this.context.listenerCount(EventType.AddedNewTransferProfile) > 0) {
            this.emitTransferProfile(newTransferProfile, amountOfTransfers);
          }

        } else {
          newTransferProfile.enterConnection = transferProfile.enterConnection;
          newTransferProfile.exitConnection = transferProfile.exitConnection;
          newTransferProfile.departureTime = transferProfile.departureTime;
        }

        if (newTransferProfile.exitConnection && newTransferProfile.enterConnection) {
          newTransferProfile.arrivalTime = arrivalTimeByTransfers[amountOfTransfers].arrivalTime;
        }

        transferProfiles.push(newTransferProfile);
      }

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
