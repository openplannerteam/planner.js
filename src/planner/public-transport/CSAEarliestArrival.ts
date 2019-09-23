import { ArrayIterator, AsyncIterator } from "asynciterator";
import { EventEmitter } from "events";
import { inject, injectable, tagged } from "inversify";
import DropOffType from "../../enums/DropOffType";
import PickupType from "../../enums/PickupType";
import ReachableStopsFinderMode from "../../enums/ReachableStopsFinderMode";
import ReachableStopsSearchPhase from "../../enums/ReachableStopsSearchPhase";
import TravelMode from "../../enums/TravelMode";
import EventType from "../../events/EventType";
import IConnection from "../../fetcher/connections/IConnection";
import IConnectionsProvider from "../../fetcher/connections/IConnectionsProvider";
import IStop from "../../fetcher/stops/IStop";
import ILocation from "../../interfaces/ILocation";
import IPath from "../../interfaces/IPath";
import IQuery from "../../interfaces/IQuery";
import ILocationResolver from "../../query-runner/ILocationResolver";
import IResolvedQuery from "../../query-runner/IResolvedQuery";
import TYPES from "../../types";
import Geo from "../../util/Geo";
import IReachableStopsFinder, { IReachableStop } from "../stops/IReachableStopsFinder";
import MultiConnectionQueue from "./CSA/data-structure/MultiConnectionQueue";
import IProfileByStop from "./CSA/data-structure/stops/IProfileByStop";
import ITransferProfile from "./CSA/data-structure/stops/ITransferProfile";
import IEnterConnectionByTrip from "./CSA/data-structure/trips/IEnterConnectionByTrip";
import IJourneyExtractor from "./IJourneyExtractor";
import IPublicTransportPlanner from "./IPublicTransportPlanner";
import JourneyExtractorEarliestArrival from "./JourneyExtractorEarliestArrival";

interface IFinalReachableStops {
  [stop: string]: IReachableStop;
}

// Implementation is as close as possible to the original paper: https://arxiv.org/pdf/1703.05997.pdf

@injectable()
export default class CSAEarliestArrival implements IPublicTransportPlanner {
  private readonly connectionsProvider: IConnectionsProvider;
  private readonly locationResolver: ILocationResolver;
  private readonly transferReachableStopsFinder: IReachableStopsFinder;
  private readonly initialReachableStopsFinder: IReachableStopsFinder;
  private readonly finalReachableStopsFinder: IReachableStopsFinder;
  private readonly eventBus: EventEmitter;

  private finalReachableStops: IFinalReachableStops = {};
  private profilesByStop: IProfileByStop = {}; // S
  private enterConnectionByTrip: IEnterConnectionByTrip = {}; // T

  private connectionsQueue: MultiConnectionQueue;

  private journeyExtractor: IJourneyExtractor;

  constructor(
    @inject(TYPES.ConnectionsProvider)
    connectionsProvider: IConnectionsProvider,
    @inject(TYPES.LocationResolver)
    locationResolver: ILocationResolver,
    @inject(TYPES.ReachableStopsFinder)
    @tagged("phase", ReachableStopsSearchPhase.Transfer)
    transferReachableStopsFinder: IReachableStopsFinder,
    @inject(TYPES.ReachableStopsFinder)
    @tagged("phase", ReachableStopsSearchPhase.Initial)
    initialReachableStopsFinder: IReachableStopsFinder,
    @inject(TYPES.ReachableStopsFinder)
    @tagged("phase", ReachableStopsSearchPhase.Final)
    finalReachableStopsFinder: IReachableStopsFinder,
    @inject(TYPES.EventBus)
    eventBus?: EventEmitter,
  ) {
    this.connectionsProvider = connectionsProvider;
    this.locationResolver = locationResolver;
    this.transferReachableStopsFinder = transferReachableStopsFinder;
    this.initialReachableStopsFinder = initialReachableStopsFinder;
    this.finalReachableStopsFinder = finalReachableStopsFinder;
    this.eventBus = eventBus;
    this.journeyExtractor = new JourneyExtractorEarliestArrival(locationResolver);
  }

  public async plan(query: IResolvedQuery): Promise<AsyncIterator<IPath>> {
    this.setBounds(query);

    return this.calculateJourneys(query);
  }

  private setBounds(query: IResolvedQuery) {
    const {
      minimumDepartureTime: lowerBoundDate,
      maximumArrivalTime: upperBoundDate,
    } = query;

    this.connectionsProvider.setIteratorOptions({
      upperBoundDate,
      lowerBoundDate,
    });
  }

  private async calculateJourneys(query: IResolvedQuery): Promise<AsyncIterator<IPath>> {
    const [hasInitialReachableStops, hasFinalReachableStops] = await Promise.all([
      this.initInitialReachableStops(query),
      this.initFinalReachableStops(query),
    ]);

    if (!hasInitialReachableStops || !hasFinalReachableStops) {
      return Promise.resolve(new ArrayIterator([]));
    }

    const connectionsIterator = this.connectionsProvider.createIterator();
    this.connectionsQueue = new MultiConnectionQueue(connectionsIterator);

    const self = this;
    return new Promise((resolve, reject) => {
      let isDone: boolean = false;

      const done = () => {
        if (!isDone) {
          self.connectionsQueue.close();

          self.extractJourneys(query)
            .then((resultIterator) => {
              resolve(resultIterator);
            });

          isDone = true;
        }
      };

      connectionsIterator.on("readable", () =>
        self.processConnections(query, done),
      );

      connectionsIterator.on("end", () => done());

      // iterator may have become readable before the listener was attached
      self.processConnections(query, done);

    }) as Promise<AsyncIterator<IPath>>;
  }

  private async extractJourneys(query: IResolvedQuery): Promise<AsyncIterator<IPath>> {
    return this.journeyExtractor.extractJourneys(this.profilesByStop, query);
  }

  private async processConnections(query: IResolvedQuery, resolve: () => void) {
    const { from, to, minimumDepartureTime } = query;
    const departureStopId: string = from[0].id;
    const arrivalStopId: string = to[0].id;

    let connection: IConnection = this.connectionsQueue.pop();

    while (connection && !this.connectionsQueue.isClosed()) {

      if (connection.departureTime < minimumDepartureTime && !this.connectionsQueue.isClosed()) {
        // starting criterion
        // skip connections before the minimum departure time
        connection = this.connectionsQueue.pop();
        continue;
      }

      if (this.getProfile(arrivalStopId).arrivalTime <= connection.departureTime.getTime()) {
        // stopping criterion
        // we cannot improve the tentative arrival time anymore
        return resolve();
      }

      const tripId = connection.tripId;
      const departureTime = connection.departureTime.getTime();

      const canRemainSeated = this.enterConnectionByTrip[tripId];
      const canTakeTransfer = (
        (
          connection.departureStop === departureStopId ||
          this.getProfile(connection.departureStop).arrivalTime <= departureTime
        ) &&
        connection["gtfs:pickupType"] !== PickupType.NotAvailable
      );

      if (canRemainSeated || canTakeTransfer) {
        // enterConnectionByTrip should point to the first reachable connection
        if (!this.enterConnectionByTrip[tripId]) {
          this.enterConnectionByTrip[tripId] = connection;
        }

        // limited walking optimization
        const canImprove = connection.arrivalTime.getTime() < this.getProfile(connection.arrivalStop).arrivalTime;
        const canLeave = connection["gtfs:dropOffType"] !== DropOffType.NotAvailable;

        if (canLeave && canImprove) {
          this.updateProfile(query, connection);
          await this.scheduleExtraConnections(query, connection);
        }
      }

      if (!this.connectionsQueue.isClosed()) {
        connection = this.connectionsQueue.pop();
        continue;
      }

      connection = undefined;
    }
  }

  private getProfile(stopId: string): ITransferProfile {
    if (!this.profilesByStop[stopId]) {
      this.profilesByStop[stopId] = {
        departureTime: Infinity,
        arrivalTime: Infinity,
      };
    }
    return this.profilesByStop[stopId];
  }

  private updateProfile(query: IResolvedQuery, connection: IConnection) {
    /*
    Call this ONLY if the given connection is known to improve the arrival stop's profile
    */

    const tripId = connection.tripId;
    const departureTime = connection.departureTime.getTime();
    const arrivalTime = connection.arrivalTime.getTime();

    // update profile of arrival stop
    const arrivalProfile: ITransferProfile = {
      departureTime,
      arrivalTime,
      exitConnection: connection,
      enterConnection: this.enterConnectionByTrip[tripId],
    };
    this.profilesByStop[connection.arrivalStop] = arrivalProfile;
  }

  private async scheduleExtraConnections(query: IResolvedQuery, sourceConnection: IConnection) {
    try {
      const arrivalStop: ILocation = await this.locationResolver.resolve(sourceConnection.arrivalStop);
      const reachableStops: IReachableStop[] = await this.transferReachableStopsFinder.findReachableStops(
        arrivalStop as IStop,
        ReachableStopsFinderMode.Source,
        query.maximumTransferDuration,
        query.minimumWalkingSpeed,
        query.profileID,
      );

      if (this.finalReachableStops[arrivalStop.id]) {
        reachableStops.push(this.finalReachableStops[arrivalStop.id]);
      }

      for (const reachableStop of reachableStops) {
        const { stop: stop, duration: duration } = reachableStop;

        if (duration && stop.id) {
          const transferTentativeArrival = this.getProfile(stop.id).arrivalTime;
          const newArrivalTime = new Date(sourceConnection.arrivalTime.getTime() + duration);

          if (transferTentativeArrival > newArrivalTime.getTime() && newArrivalTime <= query.maximumArrivalTime) {
            // create a connection that resembles a footpath
            // TODO, ditch the IReachbleStop and IConnection interfaces and make these proper objects
            const transferConnection: IConnection = {
              id: `TRANSFER_TO:${stop.id}`,
              tripId: `TRANSFER_TO:${stop.id}`,
              travelMode: TravelMode.Walking,  // TODO, this should be part of the reachable stop object
              departureTime: sourceConnection.arrivalTime,
              departureStop: sourceConnection.arrivalStop,
              arrivalTime: new Date(sourceConnection.arrivalTime.getTime() + duration),
              arrivalStop: stop.id,
            };

            this.connectionsQueue.push(transferConnection);
          }
        }
      }
    } catch (e) {
      if (this.eventBus) {
        this.eventBus.emit(EventType.Warning, (e));
      }
    }
  }

  private async initInitialReachableStops(query: IResolvedQuery): Promise<boolean> {
    const fromLocation: ILocation = query.from[0];

    // Making sure the departure location has an id
    const geoId = Geo.getId(fromLocation);
    if (!fromLocation.id) {
      query.from[0].id = geoId;
      query.from[0].name = "Departure location";
    }

    const reachableStops = await this.initialReachableStopsFinder.findReachableStops(
      fromLocation,
      ReachableStopsFinderMode.Source,
      query.maximumWalkingDuration,
      query.minimumWalkingSpeed,
      query.profileID,
    );

    // Abort when we can't reach a single stop.
    if (reachableStops.length === 0) {
      this.eventBus.emit(EventType.AbortQuery, "No reachable stops at departure location");

      return false;
    }

    if (this.eventBus) {
      this.eventBus.emit(EventType.InitialReachableStops, reachableStops);
    }

    for (const reachableStop of reachableStops) {
      const { stop: stop, duration: duration } = reachableStop;

      if (duration) {
        // create a connection that resembles a footpath
        // TODO, ditch the IReachbleStop and IConnection interfaces and make these proper objects
        const transferConnection: IConnection = {
          id: `MOVE_TO:${stop.id}`,
          tripId: `MOVE_TO:${stop.id}`,
          travelMode: TravelMode.Walking,  // TODO, this should be part of the reachable stop object
          departureTime: query.minimumDepartureTime,
          departureStop: fromLocation.id,
          arrivalTime: new Date(query.minimumDepartureTime.getTime() + duration),
          arrivalStop: stop.id,
        };

        this.connectionsQueue.push(transferConnection);
      }
    }

    return true;
  }

  private async initFinalReachableStops(query: IResolvedQuery): Promise<boolean> {
    const toLocation: ILocation = query.to[0];

    // Making sure the departure location has an id
    const geoId = Geo.getId(toLocation);
    if (!toLocation.id) {
      query.to[0].id = geoId;
      query.to[0].name = "Arrival location";
    }

    const reachableStops = await this.finalReachableStopsFinder.findReachableStops(
      toLocation,
      ReachableStopsFinderMode.Target,
      query.maximumWalkingDuration,
      query.minimumWalkingSpeed,
      query.profileID,
    );

    // Abort when we can't reach a single stop.
    if (reachableStops.length === 0) {
      this.eventBus.emit(EventType.AbortQuery, "No reachable stops at arrival location");

      return false;
    }

    if (this.eventBus) {
      this.eventBus.emit(EventType.FinalReachableStops, reachableStops);
    }

    for (const reachableStop of reachableStops) {
      if (reachableStop.duration > 0) {
        this.finalReachableStops[reachableStop.stop.id] = {
          stop: toLocation as IStop,
          duration: reachableStop.duration,
        };
      }
    }

    return true;
  }
}
