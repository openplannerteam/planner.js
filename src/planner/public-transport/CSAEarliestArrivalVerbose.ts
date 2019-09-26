import { inject, injectable, tagged } from "inversify";
import ReachableStopsSearchPhase from "../../enums/ReachableStopsSearchPhase";
import EventBus from "../../events/EventBus";
import EventType from "../../events/EventType";
import IConnection from "../../fetcher/connections/IConnection";
import IConnectionsProvider from "../../fetcher/connections/IConnectionsProvider";
import ILocationResolver from "../../query-runner/ILocationResolver";
import IResolvedQuery from "../../query-runner/IResolvedQuery";
import TYPES from "../../types";
import IReachableStopsFinder from "../stops/IReachableStopsFinder";
import CSAEarliestArrival from "./CSAEarliestArrival";

@injectable()
export default class CSAEarliestArrivalVerbose extends CSAEarliestArrival {
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
    ) {
        super(connectionsProvider, locationResolver, transferReachableStopsFinder,
            initialReachableStopsFinder, finalReachableStopsFinder);
    }

    protected updateProfile(query: IResolvedQuery, connection: IConnection) {
        super.updateProfile(query, connection);
        EventBus.getInstance().emit(EventType.PointReached, this.locationResolver.resolve(connection.arrivalStop));
    }
}
