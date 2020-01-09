import { inject, injectable, tagged } from "inversify";
import IConnection from "../../entities/connections/connections";
import ReachableStopsSearchPhase from "../../enums/ReachableStopsSearchPhase";
import EventBus from "../../events/EventBus";
import EventType from "../../events/EventType";
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

    protected updateProfile(state, query: IResolvedQuery, connection: IConnection) {
        super.updateProfile(state, query, connection);
        EventBus.getInstance().emit(EventType.ReachableLocation, this.locationResolver.resolve(connection.arrivalStop));
    }
}
