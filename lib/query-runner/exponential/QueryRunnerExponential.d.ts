import { AsyncIterator } from "asynciterator";
import { interfaces } from "inversify";
import IPath from "../../interfaces/IPath";
import IQuery from "../../interfaces/IQuery";
import IPublicTransportPlanner from "../../planner/public-transport/IPublicTransportPlanner";
import IRoadPlanner from "../../planner/road/IRoadPlanner";
import ILocationResolver from "../ILocationResolver";
import IQueryRunner from "../IQueryRunner";
/**
 * To improve the user perceived performance, the query gets split into subqueries
 * with exponentially increasing time frames:
 *
 * ```
 * minimumDepartureTime + 15 minutes, 30 minutes, 60 minutes, 120 minutes...
 * ```
 *
 * In the current implementation, the `maximumArrivalTime` is ignored
 */
export default class QueryRunnerExponential implements IQueryRunner {
    private readonly locationResolver;
    private readonly publicTransportPlannerFactory;
    private readonly eventBus;
    private readonly roadPlanner;
    constructor(locationResolver: ILocationResolver, publicTransportPlannerFactory: interfaces.Factory<IPublicTransportPlanner>, roadPlanner: IRoadPlanner);
    run(query: IQuery): Promise<AsyncIterator<IPath>>;
    private runSubquery;
    private resolveEndpoint;
    private resolveBaseQuery;
}
