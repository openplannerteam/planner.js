import { Container, interfaces } from "inversify";
import Context from "../Context";
import ReachableStopsSearchPhase from "../enums/ReachableStopsSearchPhase";
import RoutingPhase from "../enums/RoutingPhase";
import TravelMode from "../enums/TravelMode";
import CatalogFetcherDefault from "../fetcher/catalog/CatalogFetcherDefault";
import CatalogProviderDefault from "../fetcher/catalog/CatalogProviderDefault";
import ICatalogFetcher from "../fetcher/catalog/ICatalogFetcher";
import ICatalogProvider from "../fetcher/catalog/ICatalogProvider";
import ConnectionsFetcherRaw from "../fetcher/connections/ConnectionsFetcherRaw";
import ConnectionsProviderDefault from "../fetcher/connections/ConnectionsProviderDefault";
import IConnectionsFetcher from "../fetcher/connections/IConnectionsFetcher";
import IConnectionsProvider from "../fetcher/connections/IConnectionsProvider";
import HydraTemplateFetcherDefault from "../fetcher/hydra/HydraTemplateFetcherDefault";
import IHydraTemplateFetcher from "../fetcher/hydra/IHydraTemplateFetcher";
import LDFetch from "../fetcher/LDFetch";
import IProfileFetcher from "../fetcher/profiles/IProfileFetcher";
import IProfileProvider from "../fetcher/profiles/IProfileProvider";
import ProfileFetcherDefault from "../fetcher/profiles/ProfileFetcherDefault";
import ProfileProviderDefault from "../fetcher/profiles/ProfileProviderDefault";
import IStopsFetcher from "../fetcher/stops/IStopsFetcher";
import IStopsProvider from "../fetcher/stops/IStopsProvider";
import StopsFetcherLDFetch from "../fetcher/stops/ld-fetch/StopsFetcherLDFetch";
import StopsFetcherRaw from "../fetcher/stops/StopsFetcherRaw";
import StopsProviderDefault from "../fetcher/stops/StopsProviderDefault";
import IRoutableTileFetcher from "../fetcher/tiles/IRoutableTileFetcher";
import IRoutableTileProvider from "../fetcher/tiles/IRoutableTileProvider";
import RoutableTileFetcherRaw from "../fetcher/tiles/RoutableTileFetcherRaw";
import RoutableTileProviderDefault from "../fetcher/tiles/RoutableTileProviderDefault";
import HypermediaTreeFetcherDefault from "../fetcher/tree/HypermediaTreeFetcherDefault";
import HypermediaTreeProviderDefault from "../fetcher/tree/HypermediaTreeProviderDefault";
import IHypermediaTreeProvider from "../fetcher/tree/IHeadermediaTreeProvider";
import IHypermediaTreeFetcher from "../fetcher/tree/IHypermediaTreeFetcher";
import { LDLoader } from "../loader/ldloader";
import { BidirDijkstra } from "../pathfinding/bidirdijkstra/BidirDijkstra";
import DijkstraTree from "../pathfinding/dijkstra-tree/DijkstraTree";
import { IShortestPathAlgorithm, IShortestPathTreeAlgorithm } from "../pathfinding/pathfinder";
import PathfinderProvider from "../pathfinding/PathfinderProvider";
import CSAEarliestArrival from "../planner/public-transport/CSAEarliestArrival";
import IJourneyExtractor from "../planner/public-transport/IJourneyExtractor";
import IPublicTransportPlanner from "../planner/public-transport/IPublicTransportPlanner";
import JourneyExtractorProfile from "../planner/public-transport/JourneyExtractorProfile";
import IRoadPlanner from "../planner/road/IRoadPlanner";
import RoadPlannerPathfinding from "../planner/road/RoadPlannerPathfinding";
import IReachableStopsFinder from "../planner/stops/IReachableStopsFinder";
import ReachableStopsFinderBirdsEyeCached from "../planner/stops/ReachableStopsFinderBirdsEyeCached";
import ReachableStopsFinderDelaunay from "../planner/stops/ReachableStopsFinderDelaunay";
import ILocationResolver from "../query-runner/ILocationResolver";
import IQueryRunner from "../query-runner/IQueryRunner";
import LocationResolverConvenience from "../query-runner/LocationResolverConvenience";
import QueryRunnerDefault from "../query-runner/QueryRunnerDefault";
import TYPES from "../types";

const container = new Container();
container.bind<Context>(TYPES.Context).to(Context).inSingletonScope();
container.bind<IQueryRunner>(TYPES.QueryRunner).to(QueryRunnerDefault);
container.bind<ILocationResolver>(TYPES.LocationResolver).to(LocationResolverConvenience);

// TODO, make this a fixed property of the planner itself
container.bind<IJourneyExtractor>(TYPES.JourneyExtractor)
  .to(JourneyExtractorProfile);

container.bind<IPublicTransportPlanner>(TYPES.PublicTransportPlanner)
  .to(CSAEarliestArrival);
container.bind<interfaces.Factory<IPublicTransportPlanner>>(TYPES.PublicTransportPlannerFactory)
  .toAutoFactory<IPublicTransportPlanner>(TYPES.PublicTransportPlanner);

container.bind<IRoadPlanner>(TYPES.RoadPlanner)
  .to(RoadPlannerPathfinding);

container.bind<IHydraTemplateFetcher>(TYPES.HydraTemplateFetcher).to(HydraTemplateFetcherDefault).inSingletonScope();
container.bind<IHypermediaTreeFetcher>(TYPES.HypermediaTreeFetcher).to(HypermediaTreeFetcherDefault).inSingletonScope();
container.bind<IHypermediaTreeProvider>(TYPES.HypermediaTreeProvider)
  .to(HypermediaTreeProviderDefault).inSingletonScope();

container.bind<IShortestPathTreeAlgorithm>(TYPES.ShortestPathTreeAlgorithm).to(DijkstraTree).inSingletonScope();
container.bind<IShortestPathAlgorithm>(TYPES.ShortestPathAlgorithm).to(BidirDijkstra).inSingletonScope();
container.bind<PathfinderProvider>(TYPES.PathfinderProvider).to(PathfinderProvider).inSingletonScope();
container.bind<IProfileFetcher>(TYPES.ProfileFetcher).to(ProfileFetcherDefault).inSingletonScope();
container.bind<IProfileProvider>(TYPES.ProfileProvider).to(ProfileProviderDefault).inSingletonScope();

container.bind<IReachableStopsFinder>(TYPES.ReachableStopsFinder)
  .to(ReachableStopsFinderDelaunay).whenTargetTagged("phase", ReachableStopsSearchPhase.Initial);
container.bind<IReachableStopsFinder>(TYPES.ReachableStopsFinder)
  .to(ReachableStopsFinderBirdsEyeCached).whenTargetTagged("phase", ReachableStopsSearchPhase.Transfer);
container.bind<IReachableStopsFinder>(TYPES.ReachableStopsFinder)
  .to(ReachableStopsFinderDelaunay).whenTargetTagged("phase", ReachableStopsSearchPhase.Final);

container.bind<ICatalogFetcher>(TYPES.CatalogFetcher).to(CatalogFetcherDefault).inSingletonScope();
container.bind<ICatalogProvider>(TYPES.CatalogProvider).to(CatalogProviderDefault).inSingletonScope();

container.bind<IConnectionsProvider>(TYPES.ConnectionsProvider).to(ConnectionsProviderDefault).inSingletonScope();
container.bind<IConnectionsFetcher>(TYPES.ConnectionsFetcher).to(ConnectionsFetcherRaw);
container.bind<interfaces.Factory<IConnectionsFetcher>>(TYPES.ConnectionsFetcherFactory)
  .toFactory<IConnectionsFetcher>(
    (context: interfaces.Context) =>
      (travelMode: TravelMode) => {
        const fetcher = context.container.get<IConnectionsFetcher>(TYPES.ConnectionsFetcher);

        fetcher.setTravelMode(travelMode);

        return fetcher;
      },
  );

container.bind<IStopsProvider>(TYPES.StopsProvider).to(StopsProviderDefault).inSingletonScope();
container.bind<IStopsFetcher>(TYPES.StopsFetcher).to(StopsFetcherRaw);
container.bind<interfaces.Factory<IStopsFetcher>>(TYPES.StopsFetcherFactory)
  .toFactory<IStopsFetcher>(
    (context: interfaces.Context) =>
      (accessUrl: string) => {
        const fetcher = context.container.get<StopsFetcherLDFetch>(TYPES.StopsFetcher);
        fetcher.setAccessUrl(accessUrl);
        return fetcher;
      },
  );

container.bind<IRoutableTileFetcher>(TYPES.RoutableTileFetcher).to(RoutableTileFetcherRaw).inSingletonScope();
container.bind<IRoutableTileProvider>(TYPES.RoutableTileProvider)
  .to(RoutableTileProviderDefault).inSingletonScope().whenTargetTagged("phase", RoutingPhase.Base);
container.bind<IRoutableTileProvider>(TYPES.RoutableTileProvider)
  .to(RoutableTileProviderDefault).inSingletonScope().whenTargetTagged("phase", RoutingPhase.Transit);

// Init LDFetch
container.bind<LDFetch>(TYPES.LDFetch).to(LDFetch).inSingletonScope();

container.bind<LDLoader>(TYPES.LDLoader).to(LDLoader);

export default container;
