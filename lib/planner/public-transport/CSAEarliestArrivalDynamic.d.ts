/// <reference types="node" />
import { AsyncIterator } from "asynciterator";
import { EventEmitter } from "events";
import IConnection from "../../entities/connections/connections";
import GeometryValue from "../../entities/tree/geometry";
import HypermediaTree from "../../entities/tree/tree";
import IConnectionsProvider from "../../fetcher/connections/IConnectionsProvider";
import IStopsProvider from "../../fetcher/stops/IStopsProvider";
import IHypermediaTreeProvider from "../../fetcher/tree/IHeadermediaTreeProvider";
import ILocation from "../../interfaces/ILocation";
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
    connectionsIterator: AsyncIterator<IConnection>;
    mergedQueue: AsyncIterator<IConnection>;
    clusterStops: object;
    lowerBoundDate: Date;
}
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
    constructor(connectionsProvider: IConnectionsProvider, locationResolver: ILocationResolver, transferReachableStopsFinder: IReachableStopsFinder, initialReachableStopsFinder: IReachableStopsFinder, finalReachableStopsFinder: IReachableStopsFinder, treeProvider: IHypermediaTreeProvider, stopsProvider: IStopsProvider);
    plan(query: IResolvedQuery): Promise<AsyncIterator<IPath>>;
    protected clusterStops(trees: HypermediaTree[]): Promise<object>;
    protected placeLocation(location: ILocation, trees: HypermediaTree[]): GeometryValue;
    protected updateProfile(state: IQueryState, query: IResolvedQuery, connection: IConnection): Promise<void>;
    private extractJourneys;
    private processConnections;
    private getProfile;
    private scheduleExtraConnections;
    private initInitialReachableStops;
    private initFinalReachableStops;
}
export {};
