import { AsyncIterator } from "asynciterator";
import { inject, injectable } from "inversify";
import Defaults from "../Defaults";
import ILocation from "../interfaces/ILocation";
import IPath from "../interfaces/IPath";
import IQuery from "../interfaces/IQuery";
import { DurationMs } from "../interfaces/units";
import IPublicTransportPlanner from "../planner/public-transport/IPublicTransportPlanner";
import TYPES from "../types";
import ILocationResolver from "./ILocationResolver";
import IQueryRunner from "./IQueryRunner";
import IResolvedQuery from "./IResolvedQuery";

@injectable()
export default class QueryRunnerExponential implements IQueryRunner {
  private locationResolver: ILocationResolver;
  private publicTransportPlanner: IPublicTransportPlanner;

  private timespan: DurationMs = 15 * 60 * 1000; // fifteen minutes

  constructor(
    @inject(TYPES.LocationResolver) locationResolver: ILocationResolver,
    @inject(TYPES.PublicTransportPlanner) publicTransportPlanner: IPublicTransportPlanner,
  ) {
    this.locationResolver = locationResolver;
    this.publicTransportPlanner = publicTransportPlanner;
  }

  public async run(query: IQuery): Promise<AsyncIterator<IPath>> {
    const baseQuery: IResolvedQuery = await this.resolveBaseQuery(query);

    if (baseQuery.publicTransportOnly) {
      return this.publicTransportPlanner.plan(baseQuery);

    } else {
      return Promise.reject("Query not supported");
    }
  }

  private async runSubquery()

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
