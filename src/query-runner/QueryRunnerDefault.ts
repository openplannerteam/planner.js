import { AsyncIterator } from "asynciterator";
import { inject, injectable } from "inversify";
import Defaults from "../Defaults";
import ILocation from "../interfaces/ILocation";
import IPath from "../interfaces/IPath";
import IQuery from "../interfaces/IQuery";
import IPublicTransportPlanner from "../planner/public-transport/IPublicTransportPlanner";
import TYPES from "../types";
import ILocationResolver from "./ILocationResolver";
import IQueryRunner from "./IQueryRunner";
import IResolvedQuery from "./IResolvedQuery";

@injectable()
export default class QueryRunnerDefault implements IQueryRunner {
  private locationResolver: ILocationResolver;
  private publicTransportPlanner: IPublicTransportPlanner;

  constructor(
    @inject(TYPES.LocationResolver) locationResolver: ILocationResolver,
    @inject(TYPES.PublicTransportPlanner) publicTransportPlanner: IPublicTransportPlanner,
  ) {
    this.locationResolver = locationResolver;
    this.publicTransportPlanner = publicTransportPlanner;
  }

  public async run(query: IQuery): Promise<AsyncIterator<IPath>> {
    const resolvedQuery: IResolvedQuery = await this.resolveQuery(query);

    if (resolvedQuery.publicTransportOnly) {
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
      minimumDepartureTime, maximumArrivalTime,
      ...other
    } = query;
    // tslint:enable:trailing-comma

    const resolvedQuery: IResolvedQuery = Object.assign({}, other);

    resolvedQuery.minimumDepartureTime = minimumDepartureTime || new Date();

    if (maximumArrivalTime) {
      resolvedQuery.maximumArrivalTime = maximumArrivalTime;

    } else {
      const newMaximumArrivalTime = new Date(resolvedQuery.minimumDepartureTime);
      newMaximumArrivalTime.setHours(newMaximumArrivalTime.getHours() + 2);

      resolvedQuery.maximumArrivalTime = newMaximumArrivalTime;
    }

    resolvedQuery.from = await this.resolveEndpoint(from);
    resolvedQuery.to = await this.resolveEndpoint(to);
    resolvedQuery.minimumWalkingSpeed = minimumWalkingSpeed || walkingSpeed || Defaults.defaultMinimumWalkingSpeed;
    resolvedQuery.maximumWalkingSpeed = maximumWalkingSpeed || walkingSpeed || Defaults.defaultMaximumWalkingSpeed;

    resolvedQuery.maximumTransferDuration = maximumTransferDuration || Defaults.defaultMaximumTransferDuration;
    resolvedQuery.maximumTransfers = maximumTransfers || Defaults.defaultMaximumTransfers;

    return resolvedQuery;
  }
}
