import { ArrayIterator, AsyncIterator } from "asynciterator";
import { EventEmitter } from "events";
import { inject, injectable, tagged } from "inversify";
import IConnection from "../../entities/connections/connections";
import DropOffType from "../../enums/DropOffType";
import PickupType from "../../enums/PickupType";
import ReachableStopsFinderMode from "../../enums/ReachableStopsFinderMode";
import ReachableStopsSearchPhase from "../../enums/ReachableStopsSearchPhase";
import TravelMode from "../../enums/TravelMode";
import EventBus from "../../events/EventBus";
import EventType from "../../events/EventType";
import { backwardsConnectionsSelector } from "../../fetcher/connections/ConnectionSelectors";
import IConnectionsProvider from "../../fetcher/connections/IConnectionsProvider";
import IStop from "../../fetcher/stops/IStop";
import ILocation from "../../interfaces/ILocation";
import IPath from "../../interfaces/IPath";
import { DurationMs } from "../../interfaces/units";
import ILocationResolver from "../../query-runner/ILocationResolver";
import IResolvedQuery from "../../query-runner/IResolvedQuery";
import TYPES from "../../types";
import Geo from "../../util/Geo";
import MergeIterator from "../../util/iterators/MergeIterator";
import Vectors from "../../util/Vectors";
import IReachableStopsFinder, { IReachableStop } from "../stops/IReachableStopsFinder";
import IArrivalTimeByTransfers from "./CSA/data-structure/IArrivalTimeByTransfers";
import IProfilesByStop from "./CSA/data-structure/stops/IProfilesByStop";
import ITransferProfile from "./CSA/data-structure/stops/ITransferProfile";
import Profile from "./CSA/data-structure/stops/Profile";
import EarliestArrivalByTransfers from "./CSA/data-structure/trips/EarliestArrivalByTransfers";
import IEarliestArrivalByTransfers from "./CSA/data-structure/trips/IEarliestArrivalByTransfers";
import IEarliestArrivalByTrip from "./CSA/data-structure/trips/IEarliestArrivalByTrip";
import FootpathQueue from "./CSA/FootpathQueue";
import ProfileUtil from "./CSA/util/ProfileUtil";
import IJourneyExtractor from "./IJourneyExtractor";
import IPublicTransportPlanner from "./IPublicTransportPlanner";

interface IQueryState {
  profilesByStop: IProfilesByStop; // S
  earliestArrivalByTrip: IEarliestArrivalByTrip; // T
  durationToTargetByStop: object;
  gtfsTripByConnection: object;
  initialReachableStops: IReachableStop[];

  query: IResolvedQuery;
  connectionsIterator: AsyncIterator<IConnection>;
  footpathQueue: FootpathQueue;
}

/**
 * An implementation of the Profile Connection Scan Algorithm.
 * The profile connection scan algorithm takes the amount of transfers and initial, transfer and final footpaths
 * into account.
 *
 * @implements [[IPublicTransportPlanner]]
 * @property profilesByStop Describes the CSA profiles for each scanned stop.
 * @property earliestArrivalByTrip Describes the earliest arrival time for each scanned trip.
 * @property durationToTargetByStop Describes the walking duration to the target stop for a scanned stop.
 * @property gtfsTripByConnection Stores the tripIDs a connection is part of. Used for splitting and joining.
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
    const {
      minimumDepartureTime: lowerBoundDate,
      maximumArrivalTime: upperBoundDate,
    } = query;

    const footpathQueue = new FootpathQueue(true);
    const connectionsIterator = await this.connectionsProvider.createIterator({
      backward: true,
      upperBoundDate,
      lowerBoundDate,
      excludedModes: query.excludedTravelModes,
    });

    const mergedIterator = new MergeIterator(
      [connectionsIterator, footpathQueue],
      backwardsConnectionsSelector,
      true,
    );

    const queryState: IQueryState = {
      query,
      profilesByStop: {},
      earliestArrivalByTrip: {},
      durationToTargetByStop: {},
      gtfsTripByConnection: {},
      initialReachableStops: [],
      footpathQueue,
      connectionsIterator: mergedIterator,
    };

    const hasInitialReachableStops: boolean = await this.initDurationToTargetByStop(queryState);
    const hasFinalReachableStops: boolean = await this.initInitialReachableStops(queryState);

    if (!hasInitialReachableStops || !hasFinalReachableStops) {
      return Promise.resolve(new ArrayIterator([]));
    }

    const self = this;

    return new Promise((resolve, reject) => {
      let isDone: boolean = false;

      const done = () => {
        if (!isDone) {
          queryState.connectionsIterator.close();

          self.journeyExtractor.extractJourneys(queryState.profilesByStop, queryState.query)
            .then((resultIterator) => {
              resolve(resultIterator);
            });

          isDone = true;
        }
      };

      queryState.connectionsIterator.on("readable", () =>
        self.processNextConnection(queryState, done),
      );

      connectionsIterator.on("end", () => done());

      self.processNextConnection(queryState, done);

    }) as Promise<AsyncIterator<IPath>>;
  }

  private async processNextConnection(queryState: IQueryState, done: () => void) {
    let connection: IConnection = queryState.connectionsIterator.read();

    while (connection) {
      if (connection.departureTime < queryState.query.minimumDepartureTime) {
        queryState.connectionsIterator.close();
        done();
        break;
      }

      if (connection.arrivalTime > queryState.query.maximumArrivalTime && !queryState.connectionsIterator.closed) {
        connection = queryState.connectionsIterator.read();
        continue;
      }

      if (this.eventBus) {
        this.eventBus.emit(EventType.ConnectionScan, connection);
      }

      this.discoverConnection(queryState, connection);

      const earliestArrivalTime: IArrivalTimeByTransfers = this.calculateEarliestArrivalTime(queryState, connection);
      this.updateEarliestArrivalByTrip(queryState, connection, earliestArrivalTime);

      if (
        !this.isDominated(queryState, connection, earliestArrivalTime) &&
        this.hasValidRoute(queryState, earliestArrivalTime, connection.departureTime.getTime())
      ) {
        await this.getFootpathsForDepartureStop(queryState, connection, earliestArrivalTime);
      }

      if (!queryState.connectionsIterator.closed) {
        connection = queryState.connectionsIterator.read();
        continue;
      }

      connection = undefined;
    }
  }

  private hasValidRoute(
    queryState: IQueryState,
    arrivalTimeByTransfers: IArrivalTimeByTransfers,
    departureTime: number,
  ): boolean {
    if (!queryState.query.maximumTravelDuration) {
      return true;
    }

    for (const arrival of arrivalTimeByTransfers) {
      const isValid: boolean = arrival.arrivalTime - departureTime <= queryState.query.maximumTravelDuration;

      if (isValid) {
        return true;
      }
    }

    return false;
  }

  private discoverConnection(queryState: IQueryState, connection: IConnection) {
    queryState.gtfsTripByConnection[connection.id] = connection.tripId;

    if (!queryState.profilesByStop[connection.departureStop]) {
      queryState.profilesByStop[connection.departureStop] = [Profile.create(queryState.query.maximumTransfers)];
    }

    if (!queryState.profilesByStop[connection.arrivalStop]) {
      queryState.profilesByStop[connection.arrivalStop] = [Profile.create(queryState.query.maximumTransfers)];
    }

    if (!queryState.earliestArrivalByTrip[connection.tripId]) {
      queryState.earliestArrivalByTrip[connection.tripId] = EarliestArrivalByTransfers.create(
        queryState.query.maximumTransfers,
      );
    }
  }

  private getTripIdsFromConnection(queryState: IQueryState, connection: IConnection): string[] {
    const tripIds: string[] = [connection.tripId];
    return tripIds;

    /*
    // nextConnection isn't useable yet
    if (!connection.nextConnection) {
      return tripIds;
    }

    for (const connectionId of connection.nextConnection) {
      const tripId: string = queryState.gtfsTripByConnection[connectionId];

      if (tripIds.indexOf(tripId) === -1 && tripId) {
        tripIds.push(tripId);
      }
    }

    return tripIds;
    */
  }

  private calculateEarliestArrivalTime(queryState: IQueryState, connection: IConnection): IArrivalTimeByTransfers {
    const remainSeatedTime = this.remainSeated(queryState, connection);
    if (connection.dropOffType === DropOffType.NotAvailable) {
      return remainSeatedTime;
    }

    const walkToTargetTime = this.walkToTarget(queryState, connection);
    const takeTransferTime = this.takeTransfer(queryState, connection);

    return Vectors.minVector((c) => c.arrivalTime, walkToTargetTime, remainSeatedTime, takeTransferTime);
  }

  private async initDurationToTargetByStop(queryState: IQueryState): Promise<boolean> {
    const arrivalStop: IStop = queryState.query.to[0] as IStop;

    const geoId: string = Geo.getId(queryState.query.to[0]);
    if (!queryState.query.to[0].id) {
      queryState.query.to[0].id = geoId;
      queryState.query.to[0].name = "Arrival location";
    }

    const reachableStops = await this.finalReachableStopsFinder
      .findReachableStops(
        arrivalStop,
        ReachableStopsFinderMode.Target,
        queryState.query.maximumWalkingDuration,
        queryState.query.minimumWalkingSpeed,
        queryState.query.profileID,
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
        queryState.query.to[0] = reachableStop.stop; // fixme: why is this here?
      }

      queryState.durationToTargetByStop[reachableStop.stop.id] = reachableStop.duration;
    }

    return true;
  }

  private async initInitialReachableStops(queryState: IQueryState): Promise<boolean> {
    const fromLocation: IStop = queryState.query.from[0] as IStop;

    const geoId: string = Geo.getId(queryState.query.from[0]);
    if (!queryState.query.from[0].id) {
      queryState.query.from[0].id = geoId;
      queryState.query.from[0].name = "Departure location";
    }

    queryState.initialReachableStops = await this.initialReachableStopsFinder.findReachableStops(
      fromLocation,
      ReachableStopsFinderMode.Source,
      queryState.query.maximumWalkingDuration,
      queryState.query.minimumWalkingSpeed,
      queryState.query.profileID,
    );

    for (const reachableStop of queryState.initialReachableStops) {
      if (reachableStop.duration === 0) {
        // this.query.from[0] = reachableStop.stop; // wat
      }
    }

    if (queryState.initialReachableStops.length < 1) {
      if (this.eventBus) {
        this.eventBus.emit(EventType.AbortQuery, "No reachable stops at departure location");
      }

      return false;
    }

    if (this.eventBus) {
      this.eventBus.emit(EventType.InitialReachableStops, queryState.initialReachableStops);
    }

    return true;
  }

  private walkToTarget(queryState: IQueryState, connection: IConnection): IArrivalTimeByTransfers {
    const walkingTimeToTarget: DurationMs = queryState.durationToTargetByStop[connection.arrivalStop];

    if (
      walkingTimeToTarget === undefined || connection.dropOffType === DropOffType.NotAvailable ||
      connection.arrivalTime.getTime() + walkingTimeToTarget > queryState.query.maximumArrivalTime.getTime()
    ) {
      return Array(queryState.query.maximumTransfers + 1).fill({
        arrivalTime: Infinity,
        tripId: connection.tripId,
      });
    }

    return Array(queryState.query.maximumTransfers + 1).fill({
      arrivalTime: connection.arrivalTime.getTime() + walkingTimeToTarget,
      tripId: connection.tripId,
    });
  }

  private remainSeated(queryState: IQueryState, connection: IConnection): IArrivalTimeByTransfers {
    const tripIds: string[] = this.getTripIdsFromConnection(queryState, connection);
    const earliestArrivalTimeByTransfers: IArrivalTimeByTransfers = [];

    for (let amountOfTransfers = 0; amountOfTransfers < queryState.query.maximumTransfers + 1; amountOfTransfers++) {
      const earliestArrivalTime = earliestArrivalTimeByTransfers[amountOfTransfers];
      let minimumArrivalTime: number = earliestArrivalTime && earliestArrivalTime.arrivalTime;

      for (const tripId of tripIds) {
        const tripArrivalTime: number = queryState.earliestArrivalByTrip[tripId][amountOfTransfers].arrivalTime;

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

  private takeTransfer(queryState: IQueryState, connection: IConnection): IArrivalTimeByTransfers {

    const transferTimes: IArrivalTimeByTransfers = ProfileUtil.getTransferTimes(
      queryState.profilesByStop,
      connection,
      queryState.query.maximumTransfers,
      queryState.query.minimumTransferDuration,
      queryState.query.maximumTransferDuration,
    );

    if (connection.travelMode !== TravelMode.Walking) {
      // still part of the previous transfer
      return Vectors.shiftVector<IArrivalTimeByTransfers>(
        transferTimes,
        { arrivalTime: Infinity, tripId: connection.tripId },
      );
    } else {
      return transferTimes;
    }
  }

  private updateEarliestArrivalByTrip(
    queryState: IQueryState,
    connection: IConnection,
    arrivalTimeByTransfers: IArrivalTimeByTransfers,
  ): void {
    const tripIds: string[] = this.getTripIdsFromConnection(queryState, connection);

    const earliestArrivalByTransfers: IEarliestArrivalByTransfers = arrivalTimeByTransfers.map(
      (arrivalTime, amountOfTransfers: number) => {
        const tripId: string = arrivalTime.tripId;

        return queryState.earliestArrivalByTrip[tripId][amountOfTransfers];
      },
    );

    for (const tripId of tripIds) {
      queryState.earliestArrivalByTrip[tripId] = EarliestArrivalByTransfers.createByConnection(
        earliestArrivalByTransfers,
        connection,
        arrivalTimeByTransfers,
      );
    }
  }

  private isDominated(
    queryState: IQueryState,
    connection: IConnection,
    arrivalTimeByTransfers: IArrivalTimeByTransfers,
  ): boolean {
    const departureProfile = queryState.profilesByStop[connection.departureStop];
    const earliestProfileEntry = departureProfile[departureProfile.length - 1];

    return earliestProfileEntry.isDominated(arrivalTimeByTransfers, connection.departureTime.getTime());
  }

  private async getFootpathsForDepartureStop(
    queryState: IQueryState,
    connection: IConnection,
    currentArrivalTimeByTransfers: IArrivalTimeByTransfers,
  ): Promise<void> {
    const departureLocation: IStop = queryState.query.from[0] as IStop;
    const depProfile: Profile[] = queryState.profilesByStop[connection.departureStop];
    const earliestProfileEntry: Profile = depProfile[depProfile.length - 1];

    const earliestArrivalTimeByTransfers: IArrivalTimeByTransfers = Vectors.minVector(
      (c) => c.arrivalTime,
      currentArrivalTimeByTransfers,
      earliestProfileEntry.getArrivalTimeByTransfers(),
    );

    const initialReachableStop: IReachableStop = queryState.initialReachableStops.find(
      (reachable: IReachableStop) =>
        reachable.stop.id === connection.departureStop,
    );

    if (initialReachableStop) {
      this.incorporateInProfile(
        queryState,
        connection,
        initialReachableStop.duration,
        departureLocation,
        earliestArrivalTimeByTransfers,
      );
    }

    try {
      const departureStop = await this.locationResolver.resolve(connection.departureStop) as IStop;
      const reachableStops: IReachableStop[] = await this.transferReachableStopsFinder.findReachableStops(
        departureStop,
        ReachableStopsFinderMode.Target,
        queryState.query.maximumTransferDuration,
        queryState.query.minimumWalkingSpeed,
        queryState.query.profileID,
      );

      const changed = this.incorporateInProfile(
        queryState,
        connection,
        0,
        departureStop,
        earliestArrivalTimeByTransfers,
      );

      if (changed) {
        for (const reachableStop of reachableStops) {
          const { stop: stop, duration: duration } = reachableStop;

          if (duration && stop.id) {
            const newDepartureTime = new Date(connection.departureTime.getTime() - duration);

            if (newDepartureTime >= queryState.query.minimumDepartureTime) {
              // create a connection that resembles a footpath
              // TODO, ditch the IReachbleStop and IConnection interfaces and make these proper objects
              const transferConnection: IConnection = {
                id: `TRANSFER_TO:${stop.id}`,
                tripId: `TRANSFER_TO:${stop.id}`,
                travelMode: TravelMode.Walking,
                departureTime: newDepartureTime,
                departureStop: stop.id,
                arrivalTime: connection.departureTime,
                arrivalStop: connection.departureStop,
                dropOffType: DropOffType.Regular,
                pickupType: PickupType.Regular,
                headsign: stop.id,
              };

              queryState.footpathQueue.write(transferConnection);
            }
          }
        }
      }
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
    queryState: IQueryState,
    connection: IConnection,
    duration: DurationMs,
    stop: IStop,
    arrivalTimeByTransfers: IArrivalTimeByTransfers,
  ): boolean {
    const departureTime: DurationMs = connection.departureTime.getTime() - duration;

    const hasValidRoute: boolean = this.hasValidRoute(queryState, arrivalTimeByTransfers, departureTime);

    if (departureTime < queryState.query.minimumDepartureTime.getTime() || !hasValidRoute) {
      return;
    }

    let profilesByDepartureStop: Profile[] = queryState.profilesByStop[stop.id];

    if (!profilesByDepartureStop) {
      profilesByDepartureStop =
        queryState.profilesByStop[stop.id] =
        [Profile.create(queryState.query.maximumTransfers)];
    }
    const earliestDepTimeProfile: Profile = profilesByDepartureStop[profilesByDepartureStop.length - 1];

    // If arrival times for all numbers of legs are equal to the earliest entry, this
    // entry is redundant

    let useful = false;
    if (!earliestDepTimeProfile.isDominated(arrivalTimeByTransfers, departureTime)) {
      useful = true;
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

        const possibleExitConnection: IConnection = queryState.earliestArrivalByTrip[connection.tripId]
        [amountOfTransfers].connection || connection;

        if (
          arrivalTimeByTransfers[amountOfTransfers].arrivalTime < transferProfile.arrivalTime &&
          connection.pickupType !== PickupType.NotAvailable &&
          possibleExitConnection.dropOffType !== DropOffType.NotAvailable
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

      const profileIsValid: boolean = transferProfiles.reduce((memo, { arrivalTime }) =>
        memo || (arrivalTime && arrivalTime !== Infinity)
        , false);

      if (!profileIsValid) {
        return false;
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

      return useful;
    }
  }

}
