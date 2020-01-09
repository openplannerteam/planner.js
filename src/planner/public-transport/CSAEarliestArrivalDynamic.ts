import { ArrayIterator, AsyncIterator } from "asynciterator";
import { EventEmitter } from "events";
import { inject, injectable, tagged } from "inversify";
import IConnection from "../../entities/connections/connections";
import GeometryValue from "../../entities/tree/geometry";
import HypermediaTree from "../../entities/tree/tree";
import DropOffType from "../../enums/DropOffType";
import PickupType from "../../enums/PickupType";
import ReachableStopsFinderMode from "../../enums/ReachableStopsFinderMode";
import ReachableStopsSearchPhase from "../../enums/ReachableStopsSearchPhase";
import TravelMode from "../../enums/TravelMode";
import EventBus from "../../events/EventBus";
import EventType from "../../events/EventType";
import { forwardsConnectionSelector } from "../../fetcher/connections/ConnectionSelectors";
import IConnectionsProvider from "../../fetcher/connections/IConnectionsProvider";
import IStop from "../../fetcher/stops/IStop";
import IStopsProvider from "../../fetcher/stops/IStopsProvider";
import IHypermediaTreeProvider from "../../fetcher/tree/IHeadermediaTreeProvider";
import ILocation from "../../interfaces/ILocation";
import IPath from "../../interfaces/IPath";
import ILocationResolver from "../../query-runner/ILocationResolver";
import IResolvedQuery from "../../query-runner/IResolvedQuery";
import TYPES from "../../types";
import Geo from "../../util/Geo";
import MergeIterator from "../../util/iterators/MergeIterator";
import IReachableStopsFinder, { IReachableStop } from "../stops/IReachableStopsFinder";
import IProfileByStop from "./CSA/data-structure/stops/IProfileByStop";
import ITransferProfile from "./CSA/data-structure/stops/ITransferProfile";
import IEnterConnectionByTrip from "./CSA/data-structure/trips/IEnterConnectionByTrip";
import FootpathQueue from "./CSA/FootpathQueue";
import IJourneyExtractor from "./IJourneyExtractor";
import IPublicTransportPlanner from "./IPublicTransportPlanner";
import JourneyExtractorEarliestArrival from "./JourneyExtractorEarliestArrival";

interface IFinalReachableStops {
  [stop: string]: IReachableStop;
}

interface IQueryState {
  finalReachableStops: IFinalReachableStops;
  profilesByStop: IProfileByStop; // S
  enterConnectionByTrip: IEnterConnectionByTrip; // T
  footpathsQueue: FootpathQueue;
  connectionsIterator: AsyncIterator<IConnection>;
  mergedQueue: AsyncIterator<IConnection>;
  clusterStops: object;
  lowerBoundDate: Date;
}

// Implementation is as close as possible to the original paper: https://arxiv.org/pdf/1703.05997.pdf

@injectable()
export default class CSAEarliestArrivalDynamic implements IPublicTransportPlanner {
  protected readonly connectionsProvider: IConnectionsProvider;
  protected readonly locationResolver: ILocationResolver;
  protected readonly treeProvider: IHypermediaTreeProvider;
  protected readonly transferReachableStopsFinder: IReachableStopsFinder;
  protected readonly initialReachableStopsFinder: IReachableStopsFinder;
  protected readonly finalReachableStopsFinder: IReachableStopsFinder;
  protected readonly eventBus: EventEmitter;

  protected journeyExtractor: IJourneyExtractor;
  protected reachedClusters: Set<string>;
  protected stopsProvider: IStopsProvider;

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
    @inject(TYPES.HypermediaTreeProvider)
    treeProvider: IHypermediaTreeProvider,
    @inject(TYPES.StopsProvider)
    stopsProvider: IStopsProvider,
  ) {
    this.reachedClusters = new Set();
    this.treeProvider = treeProvider;
    this.connectionsProvider = connectionsProvider;
    this.locationResolver = locationResolver;
    this.transferReachableStopsFinder = transferReachableStopsFinder;
    this.initialReachableStopsFinder = initialReachableStopsFinder;
    this.finalReachableStopsFinder = finalReachableStopsFinder;
    this.eventBus = EventBus.getInstance();
    this.journeyExtractor = new JourneyExtractorEarliestArrival(locationResolver);
    this.stopsProvider = stopsProvider;
  }

  public async plan(query: IResolvedQuery): Promise<AsyncIterator<IPath>> {
    const {
      minimumDepartureTime: lowerBoundDate,
      maximumArrivalTime: upperBoundDate,
    } = query;

    const trees = await this.treeProvider.getAllTrees();
    const clusterStops = await this.clusterStops(trees);
    const startLocation = clusterStops[Geo.getId(query.from[0])];
    this.reachedClusters.add(startLocation.id);

    const footpathsQueue = new FootpathQueue();
    const connectionsIterator = await this.connectionsProvider.createIterator({
      upperBoundDate,
      lowerBoundDate,
      excludedModes: query.excludedTravelModes,
      region: startLocation,
    });

    const mergedQueue = new MergeIterator(
      [connectionsIterator, footpathsQueue],
      forwardsConnectionSelector,
      true,
    );

    const queryState: IQueryState = {
      finalReachableStops: {},
      profilesByStop: {},
      enterConnectionByTrip: {},
      footpathsQueue,
      connectionsIterator,
      clusterStops,
      mergedQueue,
      lowerBoundDate,
    };

    const [hasInitialReachableStops, hasFinalReachableStops] = await Promise.all([
      this.initInitialReachableStops(queryState, query),
      this.initFinalReachableStops(queryState, query),
    ]);

    if (!hasInitialReachableStops || !hasFinalReachableStops) {
      return Promise.resolve(new ArrayIterator([]));
    }

    const self = this;
    return new Promise((resolve, reject) => {
      let isDone: boolean = false;

      const done = () => {
        if (!isDone) {
          mergedQueue.close();

          self.extractJourneys(queryState, query)
            .then((resultIterator) => {
              resolve(resultIterator);
            });

          isDone = true;
        }
      };

      connectionsIterator.on("readable", () =>
        self.processConnections(queryState, query, done),
      );

      connectionsIterator.on("end", () => done());

      // iterator may have become readable before the listener was attached
      self.processConnections(queryState, query, done);

    }) as Promise<AsyncIterator<IPath>>;
  }

  protected async clusterStops(trees: HypermediaTree[]): Promise<object> {
    const stops = await this.stopsProvider.getAllStops();
    const result = {};
    for (const stop of stops) {
      const cluster = this.placeLocation(stop, trees);
      result[Geo.getId(stop)] = cluster;
    }
    return result;
  }

  protected placeLocation(location: ILocation, trees: HypermediaTree[]): GeometryValue {
    for (const tree of trees) {
      for (const relation of tree.relations) {
        if (relation.geoValue.contains(location)) {
          return relation.geoValue;
        }
      }
    }

  }

  protected async updateProfile(state: IQueryState, query: IResolvedQuery, connection: IConnection) {
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
      enterConnection: state.enterConnectionByTrip[tripId],
    };
    state.profilesByStop[connection.arrivalStop] = arrivalProfile;

    const cluster = state.clusterStops[connection.arrivalStop];
    if (cluster && !this.reachedClusters.has(cluster.id)) {
      const {
        maximumArrivalTime: upperBoundDate,
      } = query;

      // console.log("REACHED", cluster.id);

      this.reachedClusters.add(cluster.id);

      const newConnectionIterator = await this.connectionsProvider.appendIterator({
        upperBoundDate,
        lowerBoundDate: connection.departureTime,
        excludedModes: query.excludedTravelModes,
        region: cluster,
      }, state.connectionsIterator);

      state.connectionsIterator = newConnectionIterator;
      state.mergedQueue = new MergeIterator(
        [newConnectionIterator, state.footpathsQueue],
        forwardsConnectionSelector,
        true,
      );
    }
  }

  private async extractJourneys(state: IQueryState, query: IResolvedQuery): Promise<AsyncIterator<IPath>> {
    return this.journeyExtractor.extractJourneys(state.profilesByStop, query);
  }

  private async processConnections(state: IQueryState, query: IResolvedQuery, resolve: () => void) {
    const { from, to, minimumDepartureTime } = query;
    const departureStopId: string = from[0].id;
    const arrivalStopId: string = to[0].id;

    let connection: IConnection = state.mergedQueue.read();

    while (connection && !state.connectionsIterator.closed) {
      if (connection.departureTime < state.lowerBoundDate && !state.connectionsIterator.closed) {
        // starting criterion
        // skip connections before the minimum departure time
        connection = state.mergedQueue.read();
        continue;
      }

      state.lowerBoundDate = connection.departureTime;
      // console.log(connection.id, connection.departureTime)

      if (this.getProfile(state, arrivalStopId).arrivalTime <= connection.departureTime.getTime()) {
        // stopping criterion
        // we cannot improve the tentative arrival time anymore
        return resolve();
      }

      const tripId = connection.tripId;
      const departureTime = connection.departureTime.getTime();

      const canRemainSeated = state.enterConnectionByTrip[tripId];
      const canTakeTransfer = (
        (
          connection.departureStop === departureStopId ||
          this.getProfile(state, connection.departureStop).arrivalTime <= departureTime
        ) &&
        connection.pickupType !== PickupType.NotAvailable
      );

      if (canRemainSeated || canTakeTransfer) {
        // enterConnectionByTrip should point to the first reachable connection
        if (!state.enterConnectionByTrip[tripId]) {
          state.enterConnectionByTrip[tripId] = connection;
        }

        // limited walking optimization
        const canImprove = connection.arrivalTime.getTime() <
          this.getProfile(state, connection.arrivalStop).arrivalTime;
        const canLeave = connection.dropOffType !== DropOffType.NotAvailable;

        if (canLeave && canImprove) {
          this.updateProfile(state, query, connection);
          await this.scheduleExtraConnections(state, query, connection);
        }
      }

      if (!state.connectionsIterator.closed) {
        connection = state.mergedQueue.read();
        continue;
      }

      connection = undefined;
    }
  }

  private getProfile(state: IQueryState, stopId: string): ITransferProfile {
    if (!state.profilesByStop[stopId]) {
      state.profilesByStop[stopId] = {
        departureTime: Infinity,
        arrivalTime: Infinity,
      };
    }
    return state.profilesByStop[stopId];
  }

  private async scheduleExtraConnections(state: IQueryState, query: IResolvedQuery, sourceConnection: IConnection) {
    try {
      const arrivalStop: ILocation = await this.locationResolver.resolve(sourceConnection.arrivalStop);
      const reachableStops: IReachableStop[] = await this.transferReachableStopsFinder.findReachableStops(
        arrivalStop as IStop,
        ReachableStopsFinderMode.Source,
        query.maximumTransferDuration,
        query.minimumWalkingSpeed,
        query.profileID,
      );

      if (state.finalReachableStops[arrivalStop.id]) {
        reachableStops.push(state.finalReachableStops[arrivalStop.id]);
      }

      for (const reachableStop of reachableStops) {
        const { stop: stop, duration: duration } = reachableStop;

        if (duration && stop.id) {
          const transferTentativeArrival = this.getProfile(state, stop.id).arrivalTime;
          const newArrivalTime = new Date(sourceConnection.arrivalTime.getTime() + duration);

          if (transferTentativeArrival > newArrivalTime.getTime() && newArrivalTime <= query.maximumArrivalTime) {

            const tripId = `TRANSFER_TO:${sourceConnection.arrivalStop}@${sourceConnection.arrivalTime.getTime()}`;

            // create a connection that resembles a footpath
            // TODO, ditch the IReachbleStop and IConnection interfaces and make these proper objects
            const transferConnection: IConnection = {
              id: `${tripId}-${stop.id}`,
              tripId,
              travelMode: TravelMode.Walking,  // TODO, this should be part of the reachable stop object
              departureTime: sourceConnection.arrivalTime,
              departureStop: sourceConnection.arrivalStop,
              arrivalTime: new Date(sourceConnection.arrivalTime.getTime() + duration),
              arrivalStop: stop.id,
              dropOffType: DropOffType.Regular,
              pickupType: PickupType.Regular,
              headsign: stop.id,
            };

            state.footpathsQueue.write(transferConnection);
          }
        }
      }
    } catch (e) {
      if (this.eventBus) {
        this.eventBus.emit(EventType.Warning, (e));
      }
    }
  }

  private async initInitialReachableStops(state: IQueryState, query: IResolvedQuery): Promise<boolean> {
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
          dropOffType: DropOffType.Regular,
          pickupType: PickupType.Regular,
          headsign: stop.id,
        };

        state.footpathsQueue.write(transferConnection);
      }
    }

    return true;
  }

  private async initFinalReachableStops(state: IQueryState, query: IResolvedQuery): Promise<boolean> {
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
        state.finalReachableStops[reachableStop.stop.id] = {
          stop: toLocation as IStop,
          duration: reachableStop.duration,
        };
      }
    }

    return true;
  }
}
