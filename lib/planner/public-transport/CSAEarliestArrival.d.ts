/// <reference types="node" />
import { AsyncIterator } from "asynciterator";
import { EventEmitter } from "events";
import IConnection from "../../entities/connections/connections";
import IConnectionsProvider from "../../fetcher/connections/IConnectionsProvider";
import IPath from "../../interfaces/IPath";
import ILocationResolver from "../../query-runner/ILocationResolver";
import IResolvedQuery from "../../query-runner/IResolvedQuery";
import IReachableStopsFinder, { IReachableStop } from "../stops/IReachableStopsFinder";
import IProfileByStop from "./CSA/data-structure/stops/IProfileByStop";
import IEnterConnectionByTrip from "./CSA/data-structure/trips/IEnterConnectionByTrip";
import FootpathQueue from "./CSA/FootpathQueue";
import IJourneyExtractor from "./IJourneyExtractor";
import IPublicTransportPlanner from "./IPublicTransportPlanner";
interface IFinalReachableStops {
    [stop: string]: IReachableStop;
}
interface IQueryState {
    finalReachableStops: IFinalReachableStops;
    profilesByStop: IProfileByStop;
    enterConnectionByTrip: IEnterConnectionByTrip;
    footpathsQueue: FootpathQueue;
    connectionsQueue: AsyncIterator<IConnection>;
}
export default class CSAEarliestArrival implements IPublicTransportPlanner {
    protected readonly connectionsProvider: IConnectionsProvider;
    protected readonly locationResolver: ILocationResolver;
    protected readonly transferReachableStopsFinder: IReachableStopsFinder;
    protected readonly initialReachableStopsFinder: IReachableStopsFinder;
    protected readonly finalReachableStopsFinder: IReachableStopsFinder;
    protected readonly eventBus: EventEmitter;
    protected journeyExtractor: IJourneyExtractor;
    constructor(connectionsProvider: IConnectionsProvider, locationResolver: ILocationResolver, transferReachableStopsFinder: IReachableStopsFinder, initialReachableStopsFinder: IReachableStopsFinder, finalReachableStopsFinder: IReachableStopsFinder);
    plan(query: IResolvedQuery): Promise<AsyncIterator<IPath>>;
    protected updateProfile(state: IQueryState, query: IResolvedQuery, connection: IConnection): void;
    private extractJourneys;
    private processConnections;
    private getProfile;
    private scheduleExtraConnections;
    private initInitialReachableStops;
    private initFinalReachableStops;
}
export {};
