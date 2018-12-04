import { AsyncIterator } from "asynciterator";
import { inject, injectable } from "inversify";
import Context from "../../Context";
import Defaults from "../../Defaults";
import ILocation from "../../interfaces/ILocation";
import IPath from "../../interfaces/IPath";
import IQuery from "../../interfaces/IQuery";
import IPublicTransportPlanner from "../../planner/public-transport/IPublicTransportPlanner";
import TYPES from "../../types";
import ILocationResolver from "../ILocationResolver";
import IQueryRunner from "../IQueryRunner";
import IResolvedQuery from "../IResolvedQuery";
import ExponentialQueryIterator from "./ExponentialQueryIterator";
import FilterUniquePathsIterator from "./FilterUniquePathsIterator";
import SubqueryIterator from "./SubqueryIterator";

@injectable()
export default class QueryRunnerExponential implements IQueryRunner {
  public private;
  private locationResolver: ILocationResolver;
  private publicTransportPlanner: IPublicTransportPlanner;

  private context: Context;

  constructor(
    @inject(TYPES.Context) context: Context,
    @inject(TYPES.LocationResolver) locationResolver: ILocationResolver,
    @inject(TYPES.PublicTransportPlanner) publicTransportPlanner: IPublicTransportPlanner,
  ) {
    this.locationResolver = locationResolver;
    this.publicTransportPlanner = publicTransportPlanner;
    this.context = context;
  }

  public async run(query: IQuery): Promise<AsyncIterator<IPath>> {
    const baseQuery: IResolvedQuery = await this.resolveBaseQuery(query);

    if (baseQuery.publicTransportOnly) {

      const queryIterator = new ExponentialQueryIterator(baseQuery, 15 * 60 * 1000);
      const subqueryIterator = new SubqueryIterator<IResolvedQuery, IPath>(queryIterator, this.runSubquery.bind(this));

      return new FilterUniquePathsIterator(subqueryIterator);

    } else {
      return Promise.reject("Query not supported");
    }
  }

  private async runSubquery(query: IResolvedQuery): Promise<AsyncIterator<IPath>> {
    // TODO investigate if publicTransportPlanner can be reused or reuse some of its aggregated data
    const planner = this.context.getContainer().get<IPublicTransportPlanner>(TYPES.PublicTransportPlanner);

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
      maximumTransferDuration, maximumTransfers,
      minimumDepartureTime,
      ...other
    } = query;
    // tslint:enable:trailing-comma

    const resolvedQuery: IResolvedQuery = Object.assign({}, other);

    resolvedQuery.minimumDepartureTime = minimumDepartureTime || new Date();

    resolvedQuery.from = await this.resolveEndpoint(from);
    resolvedQuery.to = await this.resolveEndpoint(to);
    resolvedQuery.minimumWalkingSpeed = minimumWalkingSpeed || walkingSpeed || Defaults.defaultMinimumWalkingSpeed;
    resolvedQuery.maximumWalkingSpeed = maximumWalkingSpeed || walkingSpeed || Defaults.defaultMaximumWalkingSpeed;

    resolvedQuery.maximumTransferDuration = maximumTransferDuration || Defaults.defaultMaximumTransferDuration;
    resolvedQuery.maximumTransfers = maximumTransfers || Defaults.defaultMaximumTransfers;

    return resolvedQuery;
  }
}
