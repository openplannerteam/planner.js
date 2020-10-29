import { AsyncIterator } from "asynciterator";
import IConnectionsProvider from "../../fetcher/connections/IConnectionsProvider";
import IPath from "../../interfaces/IPath";
import ILocationResolver from "../../query-runner/ILocationResolver";
import IResolvedQuery from "../../query-runner/IResolvedQuery";
import IReachableStopsFinder from "../stops/IReachableStopsFinder";
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
 * @property gtfsTripByConnection Stores the tripIDs a connection is part of. Used for splitting and joining.
 *
 * @returns multiple [[IPath]]s that consist of several [[IStep]]s.
 */
export default class CSAProfile implements IPublicTransportPlanner {
    private readonly connectionsProvider;
    private readonly locationResolver;
    private readonly initialReachableStopsFinder;
    private readonly finalReachableStopsFinder;
    private readonly transferReachableStopsFinder;
    private readonly journeyExtractor;
    private readonly eventBus;
    constructor(connectionsProvider: IConnectionsProvider, locationResolver: ILocationResolver, initialReachableStopsFinder: IReachableStopsFinder, transferReachableStopsFinder: IReachableStopsFinder, finalReachableStopsFinder: IReachableStopsFinder, journeyExtractor: IJourneyExtractor);
    plan(query: IResolvedQuery): Promise<AsyncIterator<IPath>>;
    private processNextConnection;
    private hasValidRoute;
    private discoverConnection;
    private getTripIdsFromConnection;
    private calculateEarliestArrivalTime;
    private initDurationToTargetByStop;
    private initInitialReachableStops;
    private walkToTarget;
    private remainSeated;
    private takeTransfer;
    private updateEarliestArrivalByTrip;
    private isDominated;
    private getFootpathsForDepartureStop;
    private emitTransferProfile;
    private incorporateInProfile;
}
