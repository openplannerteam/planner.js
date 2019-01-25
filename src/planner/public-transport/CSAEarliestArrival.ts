import { ArrayIterator, AsyncIterator } from "asynciterator";
import { inject, injectable, tagged } from "inversify";
import Context from "../../Context";
import DropOffType from "../../enums/DropOffType";
import EventType from "../../enums/EventType";
import PickupType from "../../enums/PickupType";
import ReachableStopsFinderMode from "../../enums/ReachableStopsFinderMode";
import ReachableStopsSearchPhase from "../../enums/ReachableStopsSearchPhase";
import TravelMode from "../../enums/TravelMode";
import IConnection from "../../fetcher/connections/IConnection";
import IConnectionsProvider from "../../fetcher/connections/IConnectionsProvider";
import IStop from "../../fetcher/stops/IStop";
import ILocation from "../../interfaces/ILocation";
import IPath from "../../interfaces/IPath";
import IStep from "../../interfaces/IStep";
import ILocationResolver from "../../query-runner/ILocationResolver";
import IResolvedQuery from "../../query-runner/IResolvedQuery";
import TYPES from "../../types";
import Geo from "../../util/Geo";
import Path from "../Path";
import Step from "../Step";
import IReachableStopsFinder, { IReachableStop } from "../stops/IReachableStopsFinder";
import IProfileByStop from "./CSA/data-structure/stops/IProfileByStop";
import ITransferProfile from "./CSA/data-structure/stops/ITransferProfile";
import IEnterConnectionByTrip from "./CSA/data-structure/trips/IEnterConnectionByTrip";
import IJourneyExtractor from "./IJourneyExtractor";
import IPublicTransportPlanner from "./IPublicTransportPlanner";

/**
 * An implementation of the Connection Scan Algorithm (CSA).
 *
 * @implements [[IPublicTransportPlanner]]
 * @property profilesByStop Describes the CSA profiles for each scanned stop.
 * @property enterConnectionByTrip Describes the connection you should enter at a departure location for each trip.
 *
 * @returns multiple [[IPath]]s that consist of several [[IStep]]s.
 */
@injectable()
export default class CSAEarliestArrival implements IPublicTransportPlanner {
  private readonly connectionsProvider: IConnectionsProvider;
  private readonly locationResolver: ILocationResolver;
  private readonly initialReachableStopsFinder: IReachableStopsFinder;
  private readonly finalReachableStopsFinder: IReachableStopsFinder;
  private readonly transferReachableStopsFinder: IReachableStopsFinder;
  private readonly journeyExtractor: IJourneyExtractor;
  private readonly context: Context;

  private profilesByStop: IProfileByStop = {}; // S
  private enterConnectionByTrip: IEnterConnectionByTrip = {}; // T
  private gtfsTripsByConnection = {};

  private initialReachableStops: IReachableStop[] = [];
  private finalReachableStops: IReachableStop[] = [];

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

    this.connectionsProvider.setIteratorOptions({
      upperBoundDate,
      lowerBoundDate,
    });
  }

  private async calculateJourneys(): Promise<AsyncIterator<IPath>> {
    const hasInitialReachableStops: boolean = await this.initInitialReachableStops();
    const hasFinalReachableStops: boolean = await this.initFinalReachableStops();

    if (!hasInitialReachableStops || !hasFinalReachableStops) {
      return Promise.resolve(new ArrayIterator([]));
    }

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

  private async processNextConnection(done: () => void) {
    const connection = this.connectionsIterator.read();

    if (connection) {
      this.discoverConnection(connection);

      const arrivalStopId: string = this.query.to[0].id;
      if (this.profilesByStop[arrivalStopId].arrivalTime <= connection.departureTime.getTime()) {
        this.connectionsIterator.close();
        done();
      }

      if (connection.departureTime < this.query.minimumDepartureTime) {
        await this.maybeProcessNextConnection(done);
        return;
      }

      const tripIds = this.getTripIdsFromConnection(connection);
      for (const tripId of tripIds) {

        const canRemainSeated = this.enterConnectionByTrip[tripId];
        const canTakeTransfer = (this.profilesByStop[connection.departureStop].arrivalTime <=
          connection.departureTime.getTime() && connection["gtfs:pickupType"] !== PickupType.NotAvailable);

        if (canRemainSeated || canTakeTransfer) {
          this.updateTrips(connection, tripId);

          if (connection["gtfs:dropOffType"] !== DropOffType.NotAvailable) {
            await this.updateProfiles(connection, tripId);
          }
        }

      }

      await this.maybeProcessNextConnection(done);
    }
  }

  private async maybeProcessNextConnection(done: () => void) {
    if (!this.connectionsIterator.closed) {
      await this.processNextConnection(done);
    }
  }

  private async initInitialReachableStops(): Promise<boolean> {
    const fromLocation: IStop = this.query.from[0] as IStop;

    // Making sure the departure location has an id
    const geoId = Geo.getId(this.query.from[0]);
    if (!fromLocation.id) {
      this.query.from[0].id = geoId;
      this.query.from[0].name = "Departure location";
    }

    this.initialReachableStops = await this.initialReachableStopsFinder.findReachableStops(
      fromLocation,
      ReachableStopsFinderMode.Source,
      this.query.maximumWalkingDuration,
      this.query.minimumWalkingSpeed,
    );

    // Abort when we can't reach a single stop.
    if (this.initialReachableStops.length <= 1 && this.initialReachableStops[0].stop.id === geoId && this.context) {
      this.context.emit(EventType.AbortQuery, "No reachable stops at departure location");

      return false;
    }

    // Check if departure location is a stop.
    for (const reachableStop of this.initialReachableStops) {
      if (reachableStop.duration === 0) {
        this.query.from[0] = reachableStop.stop;
      }
    }

    if (this.context) {
      this.context.emit(EventType.InitialReachableStops, this.initialReachableStops);
    }

    this.initialReachableStops.forEach(({ stop, duration }: IReachableStop) => {
      const departureTime = this.query.minimumDepartureTime.getTime();
      const arrivalTime = this.query.minimumDepartureTime.getTime() + duration;

      this.profilesByStop[stop.id] = {
        departureTime,
        arrivalTime,
      };

      if (duration > 0) {
        const path: Path = Path.create();

        const footpath: IStep = Step.create(
          this.query.from[0],
          stop,
          TravelMode.Walking,
          {
            minimum: arrivalTime - departureTime,
          },
          new Date(departureTime),
          new Date(arrivalTime),
        );

        path.addStep(footpath);

        this.profilesByStop[stop.id].path = path;
      }

    });

    return true;
  }

  private async initFinalReachableStops(): Promise<boolean> {
    const arrivalStop: IStop = this.query.to[0] as IStop;

    const geoId = Geo.getId(this.query.to[0]);
    if (!this.query.to[0].id) {
      this.query.to[0].id = geoId;
      this.query.to[0].name = "Arrival location";
    }

    this.finalReachableStops = await this.finalReachableStopsFinder
      .findReachableStops(
        arrivalStop,
        ReachableStopsFinderMode.Target,
        this.query.maximumWalkingDuration,
        this.query.minimumWalkingSpeed,
      );

    if (this.finalReachableStops.length <= 1 && this.finalReachableStops[0].stop.id === geoId && this.context) {
      this.context.emit(EventType.AbortQuery, "No reachable stops at arrival location");

      return false;
    }

    if (this.context) {
      this.context.emit(EventType.FinalReachableStops, this.finalReachableStops);
    }

    // Check if arrival location is a stop.
    for (const reachableStop of this.finalReachableStops) {
      if (reachableStop.duration === 0) {
        this.query.to[0] = reachableStop.stop;
      }
    }

    this.profilesByStop[this.query.to[0].id] = {
      departureTime: Infinity,
      arrivalTime: Infinity,
    };

    return true;
  }

  private discoverConnection(connection: IConnection) {
    this.setTripIdsByConnectionId(connection);

    [connection.departureStop, connection.arrivalStop].forEach((stop) => {
      if (!this.profilesByStop[stop]) {
        this.profilesByStop[stop] = {
          departureTime: Infinity,
          arrivalTime: Infinity,
        };
      }
    });
  }

  private getTripIdsFromConnection(connection: IConnection): string[] {
    return this.gtfsTripsByConnection[connection.id];
  }

  private setTripIdsByConnectionId(connection: IConnection): void {
    if (!this.gtfsTripsByConnection.hasOwnProperty(connection.id)) {
      this.gtfsTripsByConnection[connection.id] = [];
    }

    this.gtfsTripsByConnection[connection.id].push(connection["gtfs:trip"]);

    let nextConnectionIndex = 0;
    while (connection.nextConnection && nextConnectionIndex < connection.nextConnection.length) {
      const connectionId = connection.nextConnection[nextConnectionIndex];

      if (!this.gtfsTripsByConnection.hasOwnProperty(connectionId)) {
        this.gtfsTripsByConnection[connectionId] = [];

      }

      this.gtfsTripsByConnection[connectionId].push(connection["gtfs:trip"]);
      nextConnectionIndex++;
    }

  }

  private updateTrips(connection: IConnection, tripId: string): void {
    const isInitialReachableStop = this.initialReachableStops.find(({ stop }: IReachableStop) =>
      stop.id === connection.departureStop,
    );

    if (!this.enterConnectionByTrip[tripId] || isInitialReachableStop) {
      this.enterConnectionByTrip[tripId] = connection;
    }
  }

  private async updateProfiles(connection: IConnection, tripId: string): Promise<void> {
    try {
      const arrivalStop: ILocation = await this.locationResolver.resolve(connection.arrivalStop);
      const reachableStops: IReachableStop[] = await this.transferReachableStopsFinder.findReachableStops(
        arrivalStop as IStop,
        ReachableStopsFinderMode.Source,
        this.query.maximumWalkingDuration,
        this.query.minimumWalkingSpeed,
      );

      reachableStops.forEach((reachableStop: IReachableStop) => {
        const { stop, duration } = reachableStop;

        if (!this.profilesByStop[stop.id]) {
          this.profilesByStop[stop.id] = {
            departureTime: Infinity,
            arrivalTime: Infinity,
          };
        }

        const reachableStopArrival = this.profilesByStop[stop.id].arrivalTime;
        const arrivalTime = connection.arrivalTime.getTime() + duration + this.query.minimumTransferDuration;

        if (reachableStopArrival > arrivalTime) {
          const transferProfile = {
            departureTime: connection.departureTime.getTime(),
            arrivalTime: connection.arrivalTime.getTime() + duration,
            exitConnection: connection,
            enterConnection: this.enterConnectionByTrip[tripId],
          };

          if (this.context && this.context.listenerCount(EventType.AddedNewTransferProfile) > 0) {
            this.emitTransferProfile(transferProfile);
          }

          this.profilesByStop[stop.id] = transferProfile;
        }

        this.checkIfArrivalStopIsReachable(connection, reachableStop);

      });

    } catch (e) {
      if (this.context) {
        this.context.emitWarning(e);
      }
    }
  }

  private checkIfArrivalStopIsReachable(connection: IConnection, { stop, duration }: IReachableStop): void {
    const canReachArrivalStop = this.finalReachableStops.find((reachableStop: IReachableStop) => {
      return reachableStop.stop.id === stop.id;
    });

    if (canReachArrivalStop && canReachArrivalStop.duration > 0) {
      const departureTime = connection.arrivalTime.getTime() + duration;
      const arrivalTime = connection.arrivalTime.getTime() + duration + canReachArrivalStop.duration;

      const path: Path = Path.create();

      const footpath: IStep = Step.create(
        stop,
        this.query.to[0],
        TravelMode.Walking,
        {
          minimum: arrivalTime - departureTime,
        },
        new Date(departureTime),
        new Date(arrivalTime),
      );

      path.addStep(footpath);

      this.profilesByStop[this.query.to[0].id] = {
        departureTime,
        arrivalTime,
        path,
      };
    }
  }

  private async emitTransferProfile(transferProfile: ITransferProfile): Promise<void> {
    try {
      const departureStop = await this.locationResolver.resolve(transferProfile.enterConnection.departureStop);
      const arrivalStop = await this.locationResolver.resolve(transferProfile.exitConnection.arrivalStop);

      this.context.emit(EventType.AddedNewTransferProfile, {
        departureStop,
        arrivalStop,
      });

    } catch (e) {
      this.context.emitWarning(e);
    }
  }
}
