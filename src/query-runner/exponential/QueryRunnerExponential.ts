import { AsyncIterator } from "asynciterator";
import { inject, injectable, interfaces } from "inversify";
import Context from "../../Context";
import Defaults from "../../Defaults";
import EventType from "../../enums/EventType";
import InvalidQueryError from "../../errors/InvalidQueryError";
import ILocation from "../../interfaces/ILocation";
import IPath from "../../interfaces/IPath";
import IQuery from "../../interfaces/IQuery";
import Path from "../../planner/Path";
import IPublicTransportPlanner from "../../planner/public-transport/IPublicTransportPlanner";
import TYPES from "../../types";
import FilterUniqueIterator from "../../util/iterators/FilterUniqueIterator";
import FlatMapIterator from "../../util/iterators/FlatMapIterator";
import Units from "../../util/Units";
import ILocationResolver from "../ILocationResolver";
import IQueryRunner from "../IQueryRunner";
import IResolvedQuery from "../IResolvedQuery";
import ExponentialQueryIterator from "./ExponentialQueryIterator";

/**
 * This exponential query runner only accepts public transport queries (`publicTransportOnly = true`).
 * It uses the registered [[IPublicTransportPlanner]] to execute them.
 *
 * To improve the user perceived performance, the query gets split into subqueries
 * with exponentially increasing time frames:
 *
 * ```
 * minimumDepartureTime + 15 minutes, 30 minutes, 60 minutes, 120 minutes...
 * ```
 *
 * In the current implementation, the `maximumArrivalTime` is ignored
 */
@injectable()
export default class QueryRunnerExponential implements IQueryRunner {
  private readonly locationResolver: ILocationResolver;
  private readonly publicTransportPlannerFactory: interfaces.Factory<IPublicTransportPlanner>;
  private readonly context: Context;

  constructor(
    @inject(TYPES.Context)
      context: Context,
    @inject(TYPES.LocationResolver)
      locationResolver: ILocationResolver,
    @inject(TYPES.PublicTransportPlannerFactory)
      publicTransportPlannerFactory: interfaces.Factory<IPublicTransportPlanner>,
  ) {
    this.context = context;
    this.locationResolver = locationResolver;
    this.publicTransportPlannerFactory = publicTransportPlannerFactory;
  }

  public async run(query: IQuery): Promise<AsyncIterator<IPath>> {
    const baseQuery: IResolvedQuery = await this.resolveBaseQuery(query);

    if (baseQuery.publicTransportOnly) {
      const queryIterator = new ExponentialQueryIterator(baseQuery, 15 * 60 * 1000);

      const subqueryIterator = new FlatMapIterator<IResolvedQuery, IPath>(
        queryIterator,
        this.runSubquery.bind(this),
      );

      return new FilterUniqueIterator<IPath>(subqueryIterator, Path.compareEquals);

    } else {
      throw new InvalidQueryError("Query should have publicTransportOnly = true");
    }
  }

  private async runSubquery(query: IResolvedQuery): Promise<AsyncIterator<IPath>> {
    // TODO investigate if publicTransportPlanner can be reused or reuse some of its aggregated data
    this.context.emit(EventType.SubQuery, query);

    const planner = this.publicTransportPlannerFactory() as IPublicTransportPlanner;

    return planner.plan(query);
  }

  private async resolveEndpoint(endpoint: string | string[] | ILocation | ILocation[]): Promise<ILocation[]> {

    if (Array.isArray(endpoint)) {
      const promises = (endpoint as Array<string | ILocation>)
        .map((singleEndpoint: string | ILocation) =>
          this.locationResolver.resolve(singleEndpoint),
        );

      return await Promise.all(promises);

    } else {
      return [await this.locationResolver.resolve(endpoint)];
    }
  }

  private async resolveBaseQuery(query: IQuery): Promise<IResolvedQuery> {
    // tslint:disable:trailing-comma
    const {
      from, to,
      minimumWalkingSpeed, maximumWalkingSpeed, walkingSpeed,
      maximumWalkingDuration, maximumWalkingDistance,
      minimumTransferDuration, maximumTransferDuration, maximumTransfers,
      minimumDepartureTime,
      ...other
    } = query;
    // tslint:enable:trailing-comma

    const resolvedQuery: IResolvedQuery = Object.assign({}, other);

    resolvedQuery.minimumDepartureTime = minimumDepartureTime || new Date();

    try {
      resolvedQuery.from = await this.resolveEndpoint(from);
      resolvedQuery.to = await this.resolveEndpoint(to);

    } catch (e) {
      return Promise.reject(new InvalidQueryError(e));
    }

    resolvedQuery.minimumWalkingSpeed = minimumWalkingSpeed || walkingSpeed || Defaults.defaultMinimumWalkingSpeed;
    resolvedQuery.maximumWalkingSpeed = maximumWalkingSpeed || walkingSpeed || Defaults.defaultMaximumWalkingSpeed;
    resolvedQuery.maximumWalkingDuration = maximumWalkingDuration ||
      Units.toDuration(maximumWalkingDistance, resolvedQuery.minimumWalkingSpeed) || Defaults.defaultWalkingDuration;

    resolvedQuery.minimumTransferDuration = minimumTransferDuration || Defaults.defaultMinimumTransferDuration;
    resolvedQuery.maximumTransferDuration = maximumTransferDuration || Defaults.defaultMaximumTransferDuration;
    resolvedQuery.maximumTransfers = maximumTransfers || Defaults.defaultMaximumTransfers;

    return resolvedQuery;
  }
}
