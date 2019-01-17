import { Container, interfaces } from "inversify";
import Catalog from "./Catalog";
import catalogDeLijn from "./catalog.delijn";
import catalogNmbs from "./catalog.nmbs";
import Context from "./Context";
import ReachableStopsSearchPhase from "./enums/ReachableStopsSearchPhase";
import TravelMode from "./enums/TravelMode";
import ConnectionsProviderMerge from "./fetcher/connections/ConnectionsProviderMerge";
import IConnectionsFetcher from "./fetcher/connections/IConnectionsFetcher";
import IConnectionsProvider from "./fetcher/connections/IConnectionsProvider";
import ConnectionsFetcherLazy from "./fetcher/connections/lazy/ConnectionsFetcherLazy";
import ConnectionsProviderPrefetch from "./fetcher/connections/prefetch/ConnectionsProviderPrefetch";
import LDFetch from "./fetcher/LDFetch";
import IStopsFetcher from "./fetcher/stops/IStopsFetcher";
import IStopsProvider from "./fetcher/stops/IStopsProvider";
import StopsFetcherLDFetch from "./fetcher/stops/ld-fetch/StopsFetcherLDFetch";
import StopsProviderDefault from "./fetcher/stops/StopsProviderDefault";
import IProfilesByStop from "./planner/public-transport/CSA/data-structure/stops/IProfilesByStop";
import CSAProfile from "./planner/public-transport/CSAProfile";
import IJourneyExtractor from "./planner/public-transport/IJourneyExtractor";
import IPublicTransportPlanner from "./planner/public-transport/IPublicTransportPlanner";
import JourneyExtractorDefault from "./planner/public-transport/JourneyExtractorDefault";
import IRoadPlanner from "./planner/road/IRoadPlanner";
import RoadPlannerBirdsEye from "./planner/road/RoadPlannerBirdsEye";
import IReachableStopsFinder from "./planner/stops/IReachableStopsFinder";
import ReachableStopsFinderOnlySelf from "./planner/stops/ReachableStopsFinderOnlySelf";
import ReachableStopsFinderRoadPlannerCached from "./planner/stops/ReachableStopsFinderRoadPlannerCached";
import QueryRunnerExponential from "./query-runner/exponential/QueryRunnerExponential";
import ILocationResolver from "./query-runner/ILocationResolver";
import IQueryRunner from "./query-runner/IQueryRunner";
import LocationResolverConvenience from "./query-runner/LocationResolverConvenience";
import TYPES from "./types";

const container = new Container();
container.bind<Context>(TYPES.Context).to(Context).inSingletonScope();
container.bind<IQueryRunner>(TYPES.QueryRunner).to(QueryRunnerExponential);
container.bind<ILocationResolver>(TYPES.LocationResolver).to(LocationResolverConvenience);

container.bind<IPublicTransportPlanner>(TYPES.PublicTransportPlanner)
  .to(CSAProfile);
container.bind<interfaces.Factory<IPublicTransportPlanner>>(TYPES.PublicTransportPlannerFactory)
  .toAutoFactory<IPublicTransportPlanner>(TYPES.PublicTransportPlanner);

container.bind<IRoadPlanner>(TYPES.RoadPlanner)
  .to(RoadPlannerBirdsEye);

container.bind<IJourneyExtractor<IProfilesByStop>>(TYPES.JourneyExtractor)
  .to(JourneyExtractorDefault);

container.bind<IReachableStopsFinder>(TYPES.ReachableStopsFinder)
  .to(ReachableStopsFinderRoadPlannerCached).whenTargetTagged("phase", ReachableStopsSearchPhase.Initial);
container.bind<IReachableStopsFinder>(TYPES.ReachableStopsFinder)
  .to(ReachableStopsFinderOnlySelf).whenTargetTagged("phase", ReachableStopsSearchPhase.Transfer);
container.bind<IReachableStopsFinder>(TYPES.ReachableStopsFinder)
  .to(ReachableStopsFinderRoadPlannerCached).whenTargetTagged("phase", ReachableStopsSearchPhase.Final);

container.bind<IConnectionsProvider>(TYPES.ConnectionsProvider).to(ConnectionsProviderPrefetch).inSingletonScope();
container.bind<IConnectionsFetcher>(TYPES.ConnectionsFetcher).to(ConnectionsFetcherLazy);
container.bind<interfaces.Factory<IConnectionsFetcher>>(TYPES.ConnectionsFetcherFactory)
  .toFactory<IConnectionsFetcher>(
    (context: interfaces.Context) =>
      (accessUrl: string, travelMode: TravelMode) => {
        const fetcher = context.container.get<ConnectionsFetcherLazy>(TYPES.ConnectionsFetcher);

        fetcher.setAccessUrl(accessUrl);
        fetcher.setTravelMode(travelMode);

        return fetcher;
      },
  );

container.bind<IStopsProvider>(TYPES.StopsProvider).to(StopsProviderDefault).inSingletonScope();
container.bind<IStopsFetcher>(TYPES.StopsFetcher).to(StopsFetcherLDFetch);
container.bind<interfaces.Factory<IStopsFetcher>>(TYPES.StopsFetcherFactory)
  .toFactory<IStopsFetcher>(
    (context: interfaces.Context) =>
      (accessUrl: string) => {
        const fetcher = context.container.get<StopsFetcherLDFetch>(TYPES.StopsFetcher);
        fetcher.setAccessUrl(accessUrl);
        return fetcher;
      },
  );

// Bind catalog
container.bind<Catalog>(TYPES.Catalog).toConstantValue(catalogNmbs);

// const combinedCatalog = Catalog.combine(catalogNmbs, catalogDeLijn);
// container.bind<Catalog>(TYPES.Catalog).toConstantValue(combinedCatalog);

// Init LDFetch
container.bind<LDFetch>(TYPES.LDFetch).to(LDFetch).inSingletonScope();

export default container;
