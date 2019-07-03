import { AsyncIterator } from "asynciterator";
import { PromiseProxyIterator } from "asynciterator-promiseproxy";
import { inject, injectable, interfaces, tagged } from "inversify";
import Context from "../../Context";
import Defaults from "../../Defaults";
import EventType from "../../enums/EventType";
import ReachableStopsSearchPhase from "../../enums/ReachableStopsSearchPhase";
import InvalidQueryError from "../../errors/InvalidQueryError";
import IConnectionsProvider from "../../fetcher/connections/IConnectionsProvider";
import ILocation from "../../interfaces/ILocation";
import IPath from "../../interfaces/IPath";
import IQuery from "../../interfaces/IQuery";
import { DurationMs } from "../../interfaces/units";
import Path from "../../planner/Path";
import CSAEarliestArrival from "../../planner/public-transport/CSAEarliestArrival";
import IPublicTransportPlanner from "../../planner/public-transport/IPublicTransportPlanner";
import JourneyExtractorEarliestArrival from "../../planner/public-transport/JourneyExtractorEarliestArrival";
import IReachableStopsFinder from "../../planner/stops/IReachableStopsFinder";
import TYPES from "../../types";
import FilterUniqueIterator from "../../util/iterators/FilterUniqueIterator";
import FlatMapIterator from "../../util/iterators/FlatMapIterator";
import Units from "../../util/Units";
import ILocationResolver from "../ILocationResolver";
import IQueryRunner from "../IQueryRunner";
import IResolvedQuery from "../IResolvedQuery";
import LinearQueryIterator from "./LinearQueryIterator";

/**
 * The query runner earliest arrival first only accepts public transport queries (`publicTransportOnly = true`).
 *
 * An earliest Arrival first connection scan is started to determine the maximumTravelDuration and the scanned period
 * needed to get at least one result.
 *
 * The registered [[IPublicTransportPlanner]] is used to execute the sub queries.
 * The maximumTravelDuration is set to the earliest arrival travel duration multiplied by 2.
 * The scanned period is set by a [[LinearQueryIterator]]. Where parameter a is set to 1.5 hours and b
 * is the initially the scanned period.
 *
 * In the current implementation, the `maximumArrivalTime` is ignored
 */
@injectable()
export default class QueryRunnerEarliestArrivalFirst implements IQueryRunner {

  private readonly context: Context;
  private readonly connectionsProvider: IConnectionsProvider;
  private readonly locationResolver: ILocationResolver;
  private readonly publicTransportPlannerFactory: interfaces.Factory<IPublicTransportPlanner>;

  private readonly journeyExtractorEarliestArrival: JourneyExtractorEarliestArrival;

  private readonly initialReachableStopsFinder: IReachableStopsFinder;
  private readonly transferReachableStopsFinder: IReachableStopsFinder;
  private readonly finalReachableStopsFinder: IReachableStopsFinder;

  constructor(
    @inject(TYPES.Context)
      context: Context,
    @inject(TYPES.ConnectionsProvider)
      connectionsProvider: IConnectionsProvider,
    @inject(TYPES.LocationResolver)
      locationResolver: ILocationResolver,
    @inject(TYPES.PublicTransportPlannerFactory)
      publicTransportPlannerFactory: interfaces.Factory<IPublicTransportPlanner>,
    @inject(TYPES.ReachableStopsFinder)
    @tagged("phase", ReachableStopsSearchPhase.Initial)
      initialReachableStopsFinder: IReachableStopsFinder,
    @inject(TYPES.ReachableStopsFinder)
    @tagged("phase", ReachableStopsSearchPhase.Transfer)
      transferReachableStopsFinder: IReachableStopsFinder,
    @inject(TYPES.ReachableStopsFinder)
    @tagged("phase", ReachableStopsSearchPhase.Final)
      finalReachableStopsFinder: IReachableStopsFinder,
  ) {
    this.context = context;
    this.connectionsProvider = connectionsProvider;
    this.locationResolver = locationResolver;
    this.publicTransportPlannerFactory = publicTransportPlannerFactory;

    this.initialReachableStopsFinder = initialReachableStopsFinder;
    this.transferReachableStopsFinder = transferReachableStopsFinder;
    this.finalReachableStopsFinder = finalReachableStopsFinder;

    this.journeyExtractorEarliestArrival = new JourneyExtractorEarliestArrival(
      locationResolver,
      context,
    );
  }

  public async run(query: IQuery): Promise<AsyncIterator<IPath>> {
    const baseQuery: IResolvedQuery = await this.resolveBaseQuery(query);

    if (baseQuery.publicTransportOnly) {

      const earliestArrivalPlanner = new CSAEarliestArrival(
        this.connectionsProvider,
        this.locationResolver,
        this.initialReachableStopsFinder,
        this.transferReachableStopsFinder,
        this.finalReachableStopsFinder,
        this.context,
      );

      const earliestArrivalIterator = await earliestArrivalPlanner.plan(baseQuery);

      const path: IPath = await new Promise((resolve) => {
        earliestArrivalIterator
          .take(1)
          .on("data", (result: IPath) => {
            resolve(result);
          })
          .on("end", () => {
            resolve(null);
          });
      });

      if (path === null && this.context) {
        this.context.emit(EventType.AbortQuery, "This query has no results");
      }

      let initialTimeSpan: DurationMs = Units.fromHours(1);
      let travelDuration: DurationMs;

      if (path && path.steps && path.steps.length > 0) {
        const firstStep = path.steps[0];
        const lastStep = path.steps[path.steps.length - 1];

        initialTimeSpan = lastStep.stopTime.getTime() - baseQuery.minimumDepartureTime.getTime();
        travelDuration = lastStep.stopTime.getTime() - firstStep.startTime.getTime();
      }

      baseQuery.maximumTravelDuration = travelDuration * 2;

      const queryIterator = new LinearQueryIterator(baseQuery, Units.fromHours(1.5), initialTimeSpan);

      const subQueryIterator = new FlatMapIterator<IResolvedQuery, IPath>(
        queryIterator,
        this.runSubquery.bind(this),
      );

      const prependedIterator = subQueryIterator.prepend([path]);

      return new FilterUniqueIterator<IPath>(prependedIterator, Path.compareEquals);

    } else {
      throw new InvalidQueryError("Query should have publicTransportOnly = true");
    }
  }

  private runSubquery(query: IResolvedQuery): AsyncIterator<IPath> {
    this.context.emit(EventType.SubQuery, query);

    const planner = this.publicTransportPlannerFactory() as IPublicTransportPlanner;

    return new PromiseProxyIterator(() => planner.plan(query));
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
      minimumTransferDuration, maximumTransferDuration, maximumTransferDistance,
      maximumTransfers,
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
    resolvedQuery.maximumTransferDuration = maximumTransferDuration ||
      Units.toDuration(maximumTransferDistance, resolvedQuery.minimumWalkingSpeed) ||
      Defaults.defaultMaximumTransferDuration;

    resolvedQuery.maximumTransfers = maximumTransfers || Defaults.defaultMaximumTransfers;

    return resolvedQuery;
  }
}
