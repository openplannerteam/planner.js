import { AsyncIterator } from "asynciterator";
import { inject, injectable } from "inversify";
import { cat } from "shelljs";
import Defaults from "../Defaults";
import InvalidQueryError from "../errors/InvalidQueryError";
import ILocation from "../interfaces/ILocation";
import IPath from "../interfaces/IPath";
import IQuery from "../interfaces/IQuery";
import IPublicTransportPlanner from "../planner/public-transport/IPublicTransportPlanner";
import IRoadPlanner from "../planner/road/IRoadPlanner";
import TYPES from "../types";
import Units from "../util/Units";
import ILocationResolver from "./ILocationResolver";
import IQueryRunner from "./IQueryRunner";
import IResolvedQuery from "./IResolvedQuery";

/**
 * This default query runner only accepts public transport queries (`publicTransportOnly = true`).
 * It uses the registered [[IPublicTransportPlanner]] to execute them.
 *
 * The default `minimumDepartureTime` is *now*. The default `maximumArrivalTime` is `minimumDepartureTime + 2 hours`.
 */
@injectable()
export default class QueryRunnerDefault implements IQueryRunner {
  private locationResolver: ILocationResolver;
  private publicTransportPlanner: IPublicTransportPlanner;
  private roadPlanner: IRoadPlanner;

  constructor(
    @inject(TYPES.LocationResolver) locationResolver: ILocationResolver,
    @inject(TYPES.PublicTransportPlanner) publicTransportPlanner: IPublicTransportPlanner,
    @inject(TYPES.RoadPlanner) roadPlanner: IRoadPlanner,
  ) {
    this.locationResolver = locationResolver;
    this.publicTransportPlanner = publicTransportPlanner;
    this.roadPlanner = roadPlanner;
  }

  public async run(query: IQuery): Promise<AsyncIterator<IPath>> {
    const resolvedQuery: IResolvedQuery = await this.resolveQuery(query);

    if (resolvedQuery.publicTransportOnly) {
      return this.publicTransportPlanner.plan(resolvedQuery);
    } else if (resolvedQuery.roadNetworkOnly) {
      return this.roadPlanner.plan(resolvedQuery);
    } else {
      throw new InvalidQueryError("Query should have publicTransportOnly = true or roadNetworkOnly = true");
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
      maximumWalkingDuration, maximumWalkingDistance,
      minimumTransferDuration, maximumTransferDuration, maximumTransferDistance,
      maximumTransfers,
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
    resolvedQuery.maximumTransferDuration = maximumTransferDuration ||
      Units.toDuration(maximumTransferDistance, resolvedQuery.minimumWalkingSpeed) ||
      Defaults.defaultMaximumTransferDuration;

    resolvedQuery.maximumTransfers = maximumTransfers || Defaults.defaultMaximumTransfers;

    return resolvedQuery;
  }
}
