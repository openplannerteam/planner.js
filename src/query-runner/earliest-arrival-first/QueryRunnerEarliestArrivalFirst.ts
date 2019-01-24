import { AsyncIterator } from "asynciterator";
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
import EarliestArrivalFirstIterator from "./EarliestArrivalFirstIterator";

@injectable()
export default class QueryRunnerEarliestArrivalFirst implements IQueryRunner {
  private readonly locationResolver: ILocationResolver;
  private readonly publicTransportPlannerFactory: interfaces.Factory<IPublicTransportPlanner>;
  private readonly context: Context;
  private earliestArrivalPlanner: CSAEarliestArrival;

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
    this.locationResolver = locationResolver;
    this.publicTransportPlannerFactory = publicTransportPlannerFactory;

    const journeyExtractorEarliestArrival = new JourneyExtractorEarliestArrival(
      locationResolver,
      context,
    );

    this.earliestArrivalPlanner = new CSAEarliestArrival(
      connectionsProvider,
      locationResolver,
      initialReachableStopsFinder,
      transferReachableStopsFinder,
      finalReachableStopsFinder,
      journeyExtractorEarliestArrival,
      context,
    );
  }

  public async run(query: IQuery): Promise<AsyncIterator<IPath>> {
    const baseQuery: IResolvedQuery = await this.resolveBaseQuery(query);

    if (baseQuery.publicTransportOnly) {

      const earliestArrivalIterator = await this.earliestArrivalPlanner.plan(baseQuery);

      const path: IPath = await new Promise((resolve, reject) => {
        earliestArrivalIterator
          .take(1)
          .on("data", (result: IPath) => {
            if (!result || !result.steps || result.steps.length === 0) {
              reject();
            }

            resolve(result);
          })
          .on("end", () => {
            reject();
          });
      });

      const initialTimeSpan: DurationMs = path.steps[path.steps.length - 1].stopTime.getTime() -
        baseQuery.minimumDepartureTime.getTime();

      console.log(initialTimeSpan);

      const queryIterator = new EarliestArrivalFirstIterator(baseQuery, initialTimeSpan || 15 * 60 * 1000);

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

  private async runSubquery(query: IResolvedQuery): Promise<AsyncIterator<IPath>> {
    this.context.emit(EventType.QueryExponential, query);

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
