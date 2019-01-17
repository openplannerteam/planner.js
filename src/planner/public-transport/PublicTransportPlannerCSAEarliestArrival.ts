import { AsyncIterator } from "asynciterator";
import { inject, injectable, tagged } from "inversify";
import Context from "../../Context";
import EventType from "../../enums/EventType";
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
export default class PublicTransportPlannerCSAEarliestArrival implements IPublicTransportPlanner {
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
    // await this.initDurationToTargetByStop();
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

      if (
        this.earliestArrivalByTrip[connection["gtfs:trip"]].connection ||
        this.profilesByStop[connection.departureStop].arrivalTime <= connection.departureTime.getTime()
      ) {
        this.updateTrips(connection);

        if (connection.arrivalTime.getTime() < this.profilesByStop[connection.arrivalStop].arrivalTime) {
          await this.getReachableStops(connection);
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

    let stopIndex = 0;
    while (stopIndex < this.initialReachableStops.length && !fromLocation.id) {
      const reachableStop = this.initialReachableStops[stopIndex];

      if (reachableStop.duration === 0) {
        this.query.from[0] = reachableStop.stop;
      }

      stopIndex++;
    }

    if (!fromLocation.id) {
      this.query.from[0].id = "geo:" + fromLocation.latitude + "," + fromLocation.longitude;
      this.query.from[0].name = "Departure location";
    }

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

  private discoverConnection(connection: IConnection) {
    [
      connection.departureStop,
      connection.arrivalStop,
      this.query.to[0].id,
    ].forEach((stop) => {
      if (!this.profilesByStop[stop]) {
        this.profilesByStop[stop] = {
          departureTime: Infinity,
          arrivalTime: Infinity,
          exitConnection: undefined,
          enterConnection: undefined,
        };
      }
    });

    if (!this.earliestArrivalByTrip[connection["gtfs:trip"]]) {
      this.earliestArrivalByTrip[connection["gtfs:trip"]] = {
        arrivalTime: Infinity,
        connection: undefined,
      };
    }
  }

  private updateTrips(connection: IConnection): void {
    if (!this.earliestArrivalByTrip[connection["gtfs:trip"]].connection) {
      this.earliestArrivalByTrip[connection["gtfs:trip"]] = {
        arrivalTime: connection.arrivalTime.getTime(),
        connection,
      };
    }
  }

  private async getReachableStops(connection: IConnection): Promise<void> {
    try {
      const departureStop: ILocation = await this.locationResolver.resolve(connection.arrivalStop);
      const reachableStops: IReachableStop[] = await this.transferReachableStopsFinder.findReachableStops(
        departureStop as IStop,
        ReachableStopsFinderMode.Source,
        this.query.maximumWalkingDuration,
        this.query.minimumWalkingSpeed,
      );

      reachableStops.forEach((reachableStop: IReachableStop) => {
        const reachableStopArrival = this.profilesByStop[reachableStop.stop.id].arrivalTime;

        if (reachableStopArrival > connection.arrivalTime.getTime() + reachableStop.duration) {
          this.profilesByStop[reachableStop.stop.id] = {
            departureTime: connection.departureTime.getTime(),
            arrivalTime: connection.arrivalTime.getTime() + reachableStop.duration,
            exitConnection: connection,
            enterConnection: this.earliestArrivalByTrip[connection["gtfs:trip"]].connection,
          };
        }

      });

    } catch (e) {
      this.context.emitWarning(e);
    }
  }
}
