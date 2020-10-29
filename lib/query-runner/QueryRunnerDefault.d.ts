import { AsyncIterator } from "asynciterator";
import IPath from "../interfaces/IPath";
import IQuery from "../interfaces/IQuery";
import IPublicTransportPlanner from "../planner/public-transport/IPublicTransportPlanner";
import IRoadPlanner from "../planner/road/IRoadPlanner";
import ILocationResolver from "./ILocationResolver";
import IQueryRunner from "./IQueryRunner";
/**
 * The default `minimumDepartureTime` is *now*. The default `maximumArrivalTime` is `minimumDepartureTime + 2 hours`.
 */
export default class QueryRunnerDefault implements IQueryRunner {
    private locationResolver;
    private publicTransportPlanner;
    private roadPlanner;
    constructor(locationResolver: ILocationResolver, publicTransportPlanner: IPublicTransportPlanner, roadPlanner: IRoadPlanner);
    run(query: IQuery): Promise<AsyncIterator<IPath>>;
    private resolveEndpoint;
    private resolveQuery;
}
