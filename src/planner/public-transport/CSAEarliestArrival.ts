import { AsyncIterator } from "asynciterator";
import { inject, injectable, tagged } from "inversify";
import Context from "../../Context";
import DropOffType from "../../enums/DropOffType";
import EventType from "../../enums/EventType";
import PickupType from "../../enums/PickupType";
import ReachableStopsFinderMode from "../../enums/ReachableStopsFinderMode";
import ReachableStopsSearchPhase from "../../enums/ReachableStopsSearchPhase";
import IConnection from "../../fetcher/connections/IConnection";
import IConnectionsProvider from "../../fetcher/connections/IConnectionsProvider";
import IStop from "../../fetcher/stops/IStop";
import ILocation from "../../interfaces/ILocation";
import IPath from "../../interfaces/IPath";
import { DurationMs } from "../../interfaces/units";
import ILocationResolver from "../../query-runner/ILocationResolver";
import IResolvedQuery from "../../query-runner/IResolvedQuery";
import TYPES from "../../types";
import IReachableStopsFinder, { IReachableStop } from "../stops/IReachableStopsFinder";
import IProfileByStop from "./CSA/data-structure/stops/IProfileByStop";
import IEarliestArrival from "./CSA/data-structure/trips/IEarliestArrival";
import IEarliestArrivalByTrip from "./CSA/data-structure/trips/IEarliestArrivalByTrip";
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
export default class CSAEarliestArrival implements IPublicTransportPlanner {
  private readonly connectionsProvider: IConnectionsProvider;
  private readonly locationResolver: ILocationResolver;
  private readonly initialReachableStopsFinder: IReachableStopsFinder;
  private readonly finalReachableStopsFinder: IReachableStopsFinder;
  private readonly transferReachableStopsFinder: IReachableStopsFinder;
  private readonly journeyExtractor: IJourneyExtractor<IProfileByStop>;
  private readonly context: Context;

  private profilesByStop: IProfileByStop = {}; // S
  private earliestArrivalByTrip: IEarliestArrivalByTrip<IEarliestArrival> = {}; // T
  private durationToTargetByStop: DurationMs[] = [];
  private gtfsTripsByConnection = {};
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
      journeyExtractor: IJourneyExtractor<IProfileByStop>,
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
      upperBoundDate,
      lowerBoundDate,
    });
  }

  private async calculateJourneys(): Promise<AsyncIterator<IPath>> {
    await this.initArrivalStopProfile();
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

  private async processNextConnection(done: () => void) {
    const connection = this.connectionsIterator.read();

    if (connection) {
      this.discoverConnection(connection);

      const arrivalStopId: string = this.query.to[0].id;
      if (this.profilesByStop[arrivalStopId].arrivalTime <= connection.departureTime.getTime()) {
        done();
      }

      if (connection.departureTime < this.query.minimumDepartureTime) {
        await this.maybeProcessNextConnection(done);
        return;
      }

      const tripIds = this.getTripIdsFromConnection(connection);
      for (const tripId of tripIds) {

        const canRemainSeated = this.earliestArrivalByTrip[tripId].connection;
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

    this.initialReachableStops = await this.initialReachableStopsFinder.findReachableStops(
      fromLocation,
      ReachableStopsFinderMode.Source,
      this.query.maximumWalkingDuration,
      this.query.minimumWalkingSpeed,
    );

    // Check if departure location is a stop.
    let stopIndex = 0;
    while (stopIndex < this.initialReachableStops.length && !this.query.from[0].id) {
      const reachableStop = this.initialReachableStops[stopIndex];

      if (reachableStop.duration === 0) {
        this.query.from[0] = reachableStop.stop;
      }

      stopIndex++;
    }

    // Making sure the departure location has an id
    if (!fromLocation.id) {
      this.query.from[0].id = "geo:" + fromLocation.latitude + "," + fromLocation.longitude;
      this.query.from[0].name = "Departure location";
    }

    // Abort when we can't reach a single stop.
    if (this.initialReachableStops.length === 0 && this.context) {
      this.context.emit(EventType.AbortQuery, "No reachable stops at departure location");

      return false;
    }

    if (this.context) {
      this.context.emit(EventType.InitialReachableStops, this.initialReachableStops);
    }

    this.initialReachableStops.forEach(({ stop, duration }: IReachableStop) => {
      this.profilesByStop[stop.id] = {
        departureTime: this.query.minimumDepartureTime.getTime(),
        arrivalTime: this.query.minimumDepartureTime.getTime() + duration,
        exitConnection: undefined,
        enterConnection: undefined,
      };

    });

    return true;
  }

  private initArrivalStopProfile(): void {
    const arrivalStopId: string = this.query.to[0].id;

    this.profilesByStop[arrivalStopId] = {
      departureTime: Infinity,
      arrivalTime: Infinity,
      exitConnection: undefined,
      enterConnection: undefined,
    };
  }

  private discoverConnection(connection: IConnection) {
    this.setTripIdsByConnectionId(connection);

    [connection.departureStop, connection.arrivalStop].forEach((stop) => {
      if (!this.profilesByStop[stop]) {
        this.profilesByStop[stop] = {
          departureTime: Infinity,
          arrivalTime: Infinity,
          exitConnection: undefined,
          enterConnection: undefined,
        };
      }
    });

    const tripIds: string[] = this.getTripIdsFromConnection(connection);

    for (const tripId of tripIds) {
      if (!this.earliestArrivalByTrip[tripId]) {
        this.earliestArrivalByTrip[tripId] = {
          arrivalTime: Infinity,
          connection: undefined,
        };
      }
    }
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
    if (!this.earliestArrivalByTrip[tripId].connection) {
      this.earliestArrivalByTrip[tripId] = {
        arrivalTime: Infinity, // don't need this
        connection, // first connection of the trip we are taking
      };
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

      reachableStops.forEach(({stop, duration}: IReachableStop) => {
        const reachableStopArrival = this.profilesByStop[stop.id].arrivalTime;

        if (reachableStopArrival > connection.arrivalTime.getTime() + duration) {
          this.profilesByStop[stop.id] = {
            departureTime: connection.departureTime.getTime(),
            arrivalTime: connection.arrivalTime.getTime() + duration,
            exitConnection: connection,
            enterConnection: this.earliestArrivalByTrip[tripId].connection,
          };
        }

      });

    } catch (e) {
      this.context.emitWarning(e);
    }
  }
}
