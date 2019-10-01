import { ArrayIterator, AsyncIterator } from "asynciterator";
import { EventEmitter } from "events";
import { inject, injectable, tagged } from "inversify";
import IConnection from "../../entities/connections/connections";
import DropOffType from "../../enums/DropOffType";
import PickupType from "../../enums/PickupType";
import ReachableStopsFinderMode from "../../enums/ReachableStopsFinderMode";
import ReachableStopsSearchPhase from "../../enums/ReachableStopsSearchPhase";
import EventBus from "../../events/EventBus";
import EventType from "../../events/EventType";
import IConnectionsProvider from "../../fetcher/connections/IConnectionsProvider";
import IStop from "../../fetcher/stops/IStop";
import ILocation from "../../interfaces/ILocation";
import IPath from "../../interfaces/IPath";
import { DurationMs } from "../../interfaces/units";
import ILocationResolver from "../../query-runner/ILocationResolver";
import IResolvedQuery from "../../query-runner/IResolvedQuery";
import TYPES from "../../types";
import Geo from "../../util/Geo";
import Vectors from "../../util/Vectors";
import IReachableStopsFinder, { IReachableStop } from "../stops/IReachableStopsFinder";
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
 * An implementation of the Profile Connection Scan Algorithm.
 * The profile connection scan algorithm takes the amount of transfers and initial, transfer and final footpaths
 * into account.
 *
 * @implements [[IPublicTransportPlanner]]
 * @property profilesByStop Describes the CSA profiles for each scanned stop.
 * @property earliestArrivalByTrip Describes the earliest arrival time for each scanned trip.
 * @property durationToTargetByStop Describes the walking duration to the target stop for a scanned stop.
 * @property gtfsTripByConnection Stores the gtfs:trip's a connection is part of. Used for splitting and joining.
 *
 * @returns multiple [[IPath]]s that consist of several [[IStep]]s.
 */
@injectable()
export default class CSAProfile implements IPublicTransportPlanner {
  private readonly connectionsProvider: IConnectionsProvider;
  private readonly locationResolver: ILocationResolver;
  private readonly initialReachableStopsFinder: IReachableStopsFinder;
  private readonly finalReachableStopsFinder: IReachableStopsFinder;
  private readonly transferReachableStopsFinder: IReachableStopsFinder;
  private readonly journeyExtractor: IJourneyExtractor;
  private readonly eventBus: EventEmitter;

  private profilesByStop: IProfilesByStop = {}; // S
  private earliestArrivalByTrip: IEarliestArrivalByTrip = {}; // T
  private durationToTargetByStop = {};
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
  ) {
    this.connectionsProvider = connectionsProvider;
    this.locationResolver = locationResolver;
    this.initialReachableStopsFinder = initialReachableStopsFinder;
    this.transferReachableStopsFinder = transferReachableStopsFinder;
    this.finalReachableStopsFinder = finalReachableStopsFinder;
    this.journeyExtractor = journeyExtractor;
    this.eventBus = EventBus.getInstance();
  }

  public async plan(query: IResolvedQuery): Promise<AsyncIterator<IPath>> {
    this.query = query;
    return this.calculateJourneys();
  }

  private async calculateJourneys(): Promise<AsyncIterator<IPath>> {
    const hasInitialReachableStops: boolean = await this.initDurationToTargetByStop();
    const hasFinalReachableStops: boolean = await this.initInitialReachableStops();

    if (!hasInitialReachableStops || !hasFinalReachableStops) {
      return Promise.resolve(new ArrayIterator([]));
    }

    const {
      minimumDepartureTime: lowerBoundDate,
      maximumArrivalTime: upperBoundDate,
    } = this.query;

    this.connectionsIterator = this.connectionsProvider.createIterator({
      backward: true,
      upperBoundDate,
      lowerBoundDate,
    });

    const self = this;

    return new Promise((resolve, reject) => {
      let isDone: boolean = false;

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

  private async processNextConnection(done: () => void) {
    let connection: IConnection = this.connectionsIterator.read();

    while (connection) {
      if (connection.arrivalTime > this.query.maximumArrivalTime && !this.connectionsIterator.closed) {
        connection = this.connectionsIterator.read();
        continue;
      }

      if (connection.departureTime < this.query.minimumDepartureTime) {
        this.connectionsIterator.close();
        done();
        break;
      }

      if (this.eventBus) {
        this.eventBus.emit(EventType.ConnectionScan, connection);
      }

      this.discoverConnection(connection);

      const earliestArrivalTime: IArrivalTimeByTransfers = this.calculateEarliestArrivalTime(connection);
      this.updateEarliestArrivalByTrip(connection, earliestArrivalTime);

      if (
        !this.isDominated(connection, earliestArrivalTime) &&
        this.hasValidRoute(earliestArrivalTime, connection.departureTime.getTime())
      ) {
        await this.getFootpathsForDepartureStop(connection, earliestArrivalTime);
      }

      if (!this.connectionsIterator.closed) {
        connection = this.connectionsIterator.read();
        continue;
      }

      connection = undefined;
    }
  }

  private hasValidRoute(arrivalTimeByTransfers: IArrivalTimeByTransfers, departureTime: number): boolean {
    if (!this.query.maximumTravelDuration) {
      return true;
    }

    for (const arrival of arrivalTimeByTransfers) {
      const isValid: boolean = arrival.arrivalTime - departureTime <= this.query.maximumTravelDuration;

      if (isValid) {
        return true;
      }
    }

    return false;
  }

  private discoverConnection(connection: IConnection) {
    this.gtfsTripByConnection[connection.id] = connection["gtfs:trip"];

    if (!this.profilesByStop[connection.departureStop]) {
      this.profilesByStop[connection.departureStop] = [Profile.create(this.query.maximumTransfers)];
    }

    if (!this.profilesByStop[connection.arrivalStop]) {
      this.profilesByStop[connection.arrivalStop] = [Profile.create(this.query.maximumTransfers)];
    }

    if (!this.earliestArrivalByTrip[connection["gtfs:trip"]]) {
      this.earliestArrivalByTrip[connection["gtfs:trip"]] = EarliestArrivalByTransfers.create(
        this.query.maximumTransfers,
      );
    }
  }

  private getTripIdsFromConnection(connection: IConnection): string[] {
    const tripIds: string[] = [connection["gtfs:trip"]];

    if (!connection.nextConnection) {
      return tripIds;
    }

    for (const connectionId of connection.nextConnection) {
      const tripId: string = this.gtfsTripByConnection[connectionId];

      if (tripIds.indexOf(tripId) === -1 && tripId) {
        tripIds.push(tripId);
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

    const geoId: string = Geo.getId(this.query.to[0]);
    if (!this.query.to[0].id) {
      this.query.to[0].id = geoId;
      this.query.to[0].name = "Arrival location";
    }

    const reachableStops = await this.finalReachableStopsFinder
      .findReachableStops(
        arrivalStop,
        ReachableStopsFinderMode.Target,
        this.query.maximumWalkingDuration,
        this.query.minimumWalkingSpeed,
        this.query.profileID,
      );

    if (reachableStops.length < 1) {
      if (this.eventBus) {
        this.eventBus.emit(EventType.AbortQuery, "No reachable stops at arrival location");
      }

      return false;
    }

    if (this.eventBus) {
      this.eventBus.emit(EventType.FinalReachableStops, reachableStops);
    }

    for (const reachableStop of reachableStops) {
      if (reachableStop.duration === 0) {
        this.query.to[0] = reachableStop.stop;
      }

      this.durationToTargetByStop[reachableStop.stop.id] = reachableStop.duration;
    }

    return true;
  }

  private async initInitialReachableStops(): Promise<boolean> {
    const fromLocation: IStop = this.query.from[0] as IStop;

    const geoId: string = Geo.getId(this.query.from[0]);
    if (!this.query.from[0].id) {
      this.query.from[0].id = geoId;
      this.query.from[0].name = "Departure location";
    }

    this.initialReachableStops = await this.initialReachableStopsFinder.findReachableStops(
      fromLocation,
      ReachableStopsFinderMode.Source,
      this.query.maximumWalkingDuration,
      this.query.minimumWalkingSpeed,
      this.query.profileID,
    );

    for (const reachableStop of this.initialReachableStops) {
      if (reachableStop.duration === 0) {
        this.query.from[0] = reachableStop.stop;
      }
    }

    if (this.initialReachableStops.length < 1) {
      if (this.eventBus) {
        this.eventBus.emit(EventType.AbortQuery, "No reachable stops at departure location");
      }

      return false;
    }

    if (this.eventBus) {
      this.eventBus.emit(EventType.InitialReachableStops, this.initialReachableStops);
    }

    return true;
  }

  private walkToTarget(connection: IConnection): IArrivalTimeByTransfers {
    const walkingTimeToTarget: DurationMs = this.durationToTargetByStop[connection.arrivalStop];

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
    const tripIds: string[] = this.getTripIdsFromConnection(connection);
    const earliestArrivalTimeByTransfers: IArrivalTimeByTransfers = [];

    for (let amountOfTransfers = 0; amountOfTransfers < this.query.maximumTransfers + 1; amountOfTransfers++) {
      const earliestArrivalTime = earliestArrivalTimeByTransfers[amountOfTransfers];
      let minimumArrivalTime: number = earliestArrivalTime && earliestArrivalTime.arrivalTime;

      for (const tripId of tripIds) {
        const tripArrivalTime: number = this.earliestArrivalByTrip[tripId][amountOfTransfers].arrivalTime;

        if (!minimumArrivalTime || tripArrivalTime < minimumArrivalTime) {
          earliestArrivalTimeByTransfers[amountOfTransfers] = {
            arrivalTime: tripArrivalTime,
            tripId,
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
    const tripIds: string[] = this.getTripIdsFromConnection(connection);

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

    return earliestProfileEntry.isDominated(arrivalTimeByTransfers, connection.departureTime.getTime());
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
        this.query.maximumTransferDuration,
        this.query.minimumWalkingSpeed,
        this.query.profileID,
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
      if (this.eventBus) {
        this.eventBus.emit(EventType.Warning, (e));
      }
    }
  }

  private async emitTransferProfile(transferProfile: ITransferProfile, amountOfTransfers: number): Promise<void> {
    try {
      const departureStop: ILocation = await this.locationResolver.resolve(
        transferProfile.enterConnection.departureStop,
      );
      const arrivalStop: ILocation = await this.locationResolver.resolve(
        transferProfile.exitConnection.arrivalStop,
      );

      this.eventBus.emit(EventType.AddedNewTransferProfile, {
        departureStop,
        arrivalStop,
        amountOfTransfers,
      });

    } catch (e) {
      this.eventBus.emit(EventType.Warning, (e));
    }
  }

  private incorporateInProfile(
    connection: IConnection,
    duration: DurationMs,
    stop: IStop,
    arrivalTimeByTransfers: IArrivalTimeByTransfers,
  ): void {
    const departureTime: DurationMs = connection.departureTime.getTime() - duration;

    const hasValidRoute: boolean = this.hasValidRoute(arrivalTimeByTransfers, departureTime);

    if (departureTime < this.query.minimumDepartureTime.getTime() || !hasValidRoute) {
      return;
    }

    let profilesByDepartureStop: Profile[] = this.profilesByStop[stop.id];

    if (!profilesByDepartureStop) {
      profilesByDepartureStop = this.profilesByStop[stop.id] = [Profile.create(this.query.maximumTransfers)];
    }
    const earliestDepTimeProfile: Profile = profilesByDepartureStop[profilesByDepartureStop.length - 1];

    // If arrival times for all numbers of legs are equal to the earliest entry, this
    // entry is redundant

    if (!earliestDepTimeProfile.isDominated(arrivalTimeByTransfers, departureTime)) {
      const currentTransferProfiles: ITransferProfile[] = earliestDepTimeProfile.transferProfiles;
      const transferProfiles: ITransferProfile[] = [];

      for (let amountOfTransfers = 0; amountOfTransfers < currentTransferProfiles.length; amountOfTransfers++) {
        const transferProfile: ITransferProfile = currentTransferProfiles[amountOfTransfers];

        const newTransferProfile: ITransferProfile = {
          exitConnection: undefined,
          enterConnection: undefined,
          arrivalTime: Infinity,
          departureTime: Infinity,
        };

        const possibleExitConnection: IConnection = this.earliestArrivalByTrip[connection["gtfs:trip"]]
          [amountOfTransfers].connection || connection;

        if (
          arrivalTimeByTransfers[amountOfTransfers].arrivalTime < transferProfile.arrivalTime &&
          connection["gtfs:pickupType"] !== PickupType.NotAvailable &&
          possibleExitConnection["gtfs:dropOfType"] !== DropOffType.NotAvailable
        ) {
          newTransferProfile.enterConnection = connection;
          newTransferProfile.exitConnection = possibleExitConnection;
          newTransferProfile.departureTime = departureTime;

          if (this.eventBus && this.eventBus.listenerCount(EventType.AddedNewTransferProfile) > 0) {
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

      const profileIsValid: boolean = transferProfiles.reduce((memo, {arrivalTime}) =>
        memo || (arrivalTime && arrivalTime !== Infinity)
        , false);

      if (!profileIsValid) {
        return;
      }

      const newProfile: Profile = Profile.createFromTransfers(departureTime, transferProfiles);

      let profileIndex: number = profilesByDepartureStop.length - 1;
      let earliestProfile: Profile = profilesByDepartureStop[profileIndex];

      if (earliestProfile.departureTime === Infinity) {
        profilesByDepartureStop[profileIndex] = newProfile;
      } else {
        while (profileIndex > 0 && earliestProfile.departureTime < departureTime) {
          profilesByDepartureStop[profileIndex + 1] = earliestProfile;
          profileIndex--;
          earliestProfile = profilesByDepartureStop[profileIndex];
        }
        profilesByDepartureStop[profileIndex + 1] = newProfile;
      }
    }
  }

}
