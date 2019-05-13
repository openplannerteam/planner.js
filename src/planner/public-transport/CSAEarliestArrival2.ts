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
import ILocationResolver from "../../query-runner/ILocationResolver";
import IResolvedQuery from "../../query-runner/IResolvedQuery";
import TYPES from "../../types";
import IReachableStopsFinder, { IReachableStop } from "../stops/IReachableStopsFinder";
import IProfileByStop from "./CSA/data-structure/stops/IProfileByStop";
import ITransferProfile from "./CSA/data-structure/stops/ITransferProfile";
import IEnterConnectionByTrip from "./CSA/data-structure/trips/IEnterConnectionByTrip";
import IJourneyExtractor from "./IJourneyExtractor";
import IPublicTransportPlanner from "./IPublicTransportPlanner";
import JourneyExtractor2 from "./JourneyExtractor2";

@injectable()
export default class CSAEarliestArrival2 implements IPublicTransportPlanner {
  private readonly connectionsProvider: IConnectionsProvider;
  private readonly locationResolver: ILocationResolver;
  private readonly transferReachableStopsFinder: IReachableStopsFinder;
  private readonly context: Context;

  private profilesByStop: IProfileByStop = {}; // S
  private enterConnectionByTrip: IEnterConnectionByTrip = {}; // T

  private connectionsIterator: AsyncIterator<IConnection>;

  private journeyExtractor: IJourneyExtractor;

  constructor(
    @inject(TYPES.ConnectionsProvider)
      connectionsProvider: IConnectionsProvider,
    @inject(TYPES.LocationResolver)
      locationResolver: ILocationResolver,
    @inject(TYPES.ReachableStopsFinder)
    @tagged("phase", ReachableStopsSearchPhase.Transfer)
      transferReachableStopsFinder: IReachableStopsFinder,
    @inject(TYPES.Context)
      context?: Context,
  ) {
    this.connectionsProvider = connectionsProvider;
    this.locationResolver = locationResolver;
    this.transferReachableStopsFinder = transferReachableStopsFinder;
    this.context = context;
    this.journeyExtractor = new JourneyExtractor2(locationResolver);
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
    this.connectionsIterator = this.connectionsProvider.createIterator();

    const self = this;

    return new Promise((resolve, reject) => {
      let isDone: boolean = false;

      const done = () => {
        if (!isDone) {
          self.connectionsIterator.close();
          self.connectionsIterator._end();

          self.extractJourneys(query)
            .then((resultIterator) => {
              resolve(resultIterator);
            });

          isDone = true;
        }
      };

      this.connectionsIterator.on("readable", () =>
        self.processConnections(query, done),
      );

      this.connectionsIterator.on("end", () => done());

    }) as Promise<AsyncIterator<IPath>>;
  }

  private async extractJourneys(query: IResolvedQuery): Promise<AsyncIterator<IPath>> {
    return this.journeyExtractor.extractJourneys(this.profilesByStop, query);
  }

  private async processConnections(query: IResolvedQuery, resolve: () => void) {
    const {from, to, minimumDepartureTime} = query;
    const departureStopId: string = from[0].id;
    const arrivalStopId: string = to[0].id;

    let connection: IConnection = this.connectionsIterator.read();

    while (connection && !this.connectionsIterator.closed) {

      if (connection.departureTime < minimumDepartureTime && !this.connectionsIterator.closed) {
        // starting criterion
        // skip connections before the minimum departure time
        connection = this.connectionsIterator.read();
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
          await this.updateProfiles(query, connection);
        }
      }

      if (!this.connectionsIterator.closed) {
        connection = this.connectionsIterator.read();
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

  private async updateProfiles(query: IResolvedQuery, connection: IConnection): Promise<void> {
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

    // update profiles of other reachable stops
    try {
      const arrivalStop: ILocation = await this.locationResolver.resolve(connection.arrivalStop);
      const reachableStops: IReachableStop[] = await this.transferReachableStopsFinder.findReachableStops(
        arrivalStop as IStop,
        ReachableStopsFinderMode.Source,
        query.maximumTransferDuration,
        query.minimumWalkingSpeed,
      );

      for (const reachableStop of reachableStops) {
        const { id: transferId, stop: transferStop, duration: transferDuration } = reachableStop;
        const transferTentativeArrival = this.getProfile(transferStop.id).arrivalTime;

        if (transferDuration && transferTentativeArrival > arrivalTime) {
          // create a connection that resembles a footpath
          // TODO, ditch the IReachbleStop and IConnection interfaces and make these proper objects
          const transferConnection: IConnection = {
            id: transferId,
            travelMode: TravelMode.Walking,
            departureTime: new Date(arrivalTime),
            departureStop: connection.arrivalStop,
            arrivalTime: new Date(arrivalTime + transferDuration),
            arrivalStop: transferStop.id,
          };

          const transferProfile: ITransferProfile = {
            departureTime: arrivalTime,
            arrivalTime: arrivalTime + transferDuration,
            exitConnection: connection,
            enterConnection: transferConnection,
          };

          this.profilesByStop[transferStop.id] = transferProfile;
        }
      }
    } catch (e) {
      if (this.context) {
        this.context.emitWarning(e);
      }
    }
  }
}
