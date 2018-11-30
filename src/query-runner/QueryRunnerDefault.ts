import { AsyncIterator } from "asynciterator";
import { inject, injectable, named } from "inversify";
import Defaults from "../Defaults";
import ILocation from "../interfaces/ILocation";
import IPath from "../interfaces/IPath";
import IQuery from "../interfaces/IQuery";
import IPublicTransportPlanner from "../planner/public-transport/IPublicTransportPlanner";
import IRoadPlanner from "../planner/road/IRoadPlanner";
import TYPES from "../types";
import ILocationResolver from "./ILocationResolver";
import IQueryRunner from "./IQueryRunner";
import IResolvedQuery from "./IResolvedQuery";

@injectable()
export default class QueryRunnerDefault implements IQueryRunner {
  private locationResolver: ILocationResolver;
  private publicTransportPlanner: IPublicTransportPlanner;
  private roadPlanner: IRoadPlanner;

  constructor(
    @inject(TYPES.LocationResolver) locationResolver: ILocationResolver,
    @inject(TYPES.PublicTransportPlanner) publicTransportPlanner: IPublicTransportPlanner,
    @inject(TYPES.RoadPlanner) @named("base") roadPlanner: IRoadPlanner,
  ) {
    this.locationResolver = locationResolver;
    this.publicTransportPlanner = publicTransportPlanner;
    this.roadPlanner = roadPlanner;
  }

  public async run(query: IQuery): Promise<AsyncIterator<IPath>> {
    const resolvedQuery: IResolvedQuery = await this.resolveQuery(query);

    if (resolvedQuery.roadOnly) {
      return this.roadPlanner.plan(resolvedQuery);

    } else if (resolvedQuery.publicTransportOnly) {
      return this.publicTransportPlanner.plan(resolvedQuery);

    } else {
      return Promise.reject("Query not supported");
    }
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

  private async resolveQuery(query: IQuery): Promise<IResolvedQuery> {
    // tslint:disable:trailing-comma
    const {
      from, to,
      minimumWalkingSpeed, maximumWalkingSpeed, walkingSpeed,
      maximumTransferDuration, maximumTransfers,
      ...other
    } = query;
    // tslint:enable:trailing-comma

    const resolvedQuery: IResolvedQuery = Object.assign({}, other);

    resolvedQuery.from = await this.resolveEndpoint(from);
    resolvedQuery.to = await this.resolveEndpoint(to);
    resolvedQuery.minimumWalkingSpeed = minimumWalkingSpeed || walkingSpeed || Defaults.defaultMinimumWalkingSpeed;
    resolvedQuery.maximumWalkingSpeed = maximumWalkingSpeed || walkingSpeed || Defaults.defaultMaximumWalkingSpeed;

    resolvedQuery.maximumTransferDuration = maximumTransferDuration || Defaults.defaultMaximumTransferDuration;
    resolvedQuery.maximumTransfers = maximumTransfers || Defaults.defaultMaximumTransfers;

    return resolvedQuery;
  }
}
