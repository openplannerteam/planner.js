import { Container, interfaces } from "inversify";
import Catalog from "../Catalog";
import catalogDeLijn from "../catalog.delijn.vlaenderen";
import catalogNmbs from "../catalog.nmbs";
import Context from "../Context";
import RoutableTileRegistry from "../entities/tiles/registry";
import ReachableStopsSearchPhase from "../enums/ReachableStopsSearchPhase";
import RoutingPhase from "../enums/RoutingPhase";
import TravelMode from "../enums/TravelMode";
import IConnectionsFetcher from "../fetcher/connections/IConnectionsFetcher";
import IConnectionsProvider from "../fetcher/connections/IConnectionsProvider";
import ConnectionsFetcherLazy from "../fetcher/connections/lazy/ConnectionsFetcherLazy";
import ConnectionsProviderPrefetch from "../fetcher/connections/prefetch/ConnectionsProviderPrefetch";
import FootpathsProviderDefault from "../fetcher/footpaths/FootpathsProviderDefault";
import IFootpathsFetcher from "../fetcher/footpaths/IFootpathsProvider";
import LDFetch from "../fetcher/LDFetch";
import IProfileFetcher from "../fetcher/profiles/IProfileFetcher";
import IProfileProvider from "../fetcher/profiles/IProfileProvider";
import ProfileFetcherDefault from "../fetcher/profiles/ProfileFetcherDefault";
import ProfileProviderDefault from "../fetcher/profiles/ProfileProviderDefault";
import IStopsFetcher from "../fetcher/stops/IStopsFetcher";
import IStopsProvider from "../fetcher/stops/IStopsProvider";
import StopsFetcherLDFetch from "../fetcher/stops/ld-fetch/StopsFetcherLDFetch";
import StopsProviderDefault from "../fetcher/stops/StopsProviderDefault";
import IRoutableTileFetcher from "../fetcher/tiles/IRoutableTileFetcher";
import IRoutableTileProvider from "../fetcher/tiles/IRoutableTileProvider";
import RoutableTileFetcherRaw from "../fetcher/tiles/RoutableTileFetcherRaw";
import RoutableTileProviderDefault from "../fetcher/tiles/RoutableTileProviderDefault";
import RoutableTileProviderTransit from "../fetcher/tiles/RoutableTileProviderTransit";

import { LDLoader } from "../loader/ldloader";
import { BidirDijkstra } from "../pathfinding/bidirdijkstra/BidirDijkstra";
import DijkstraTree from "../pathfinding/dijkstra-tree/DijkstraTree";
import { IShortestPathAlgorithm, IShortestPathTreeAlgorithm } from "../pathfinding/pathfinder";
import PathfinderProvider from "../pathfinding/PathfinderProvider";
import CSAEarliestArrivalVerbose from "../planner/public-transport/CSAEarliestArrivalVerbose";
import IJourneyExtractor from "../planner/public-transport/IJourneyExtractor";
import IPublicTransportPlanner from "../planner/public-transport/IPublicTransportPlanner";
import JourneyExtractorProfile from "../planner/public-transport/JourneyExtractorProfile";
import IRoadPlanner from "../planner/road/IRoadPlanner";
import RoadPlannerPathfinding from "../planner/road/RoadPlannerPathfinding";
import IReachableStopsFinder from "../planner/stops/IReachableStopsFinder";
import ReachableStopsFinderDelaunay from "../planner/stops/ReachableStopsFinderDelaunay";
import ReachableStopsFinderFootpathsVerbose from "../planner/stops/ReachableStopsFinderFootpathsVerbose";
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
  .to(CSAEarliestArrivalVerbose);
container.bind<interfaces.Factory<IPublicTransportPlanner>>(TYPES.PublicTransportPlannerFactory)
  .toAutoFactory<IPublicTransportPlanner>(TYPES.PublicTransportPlanner);

container.bind<IRoadPlanner>(TYPES.RoadPlanner)
  .to(RoadPlannerPathfinding);

container.bind<IShortestPathTreeAlgorithm>(TYPES.ShortestPathTreeAlgorithm).to(DijkstraTree).inSingletonScope();
container.bind<IShortestPathAlgorithm>(TYPES.ShortestPathAlgorithm).to(BidirDijkstra).inSingletonScope();
container.bind<PathfinderProvider>(TYPES.PathfinderProvider).to(PathfinderProvider).inSingletonScope();
container.bind<IProfileFetcher>(TYPES.ProfileFetcher).to(ProfileFetcherDefault).inSingletonScope();
container.bind<IProfileProvider>(TYPES.ProfileProvider).to(ProfileProviderDefault).inSingletonScope();

container.bind<IFootpathsFetcher>(TYPES.FootpathsProvider).to(FootpathsProviderDefault).inSingletonScope();

container.bind<IReachableStopsFinder>(TYPES.ReachableStopsFinder)
  .to(ReachableStopsFinderDelaunay).whenTargetTagged("phase", ReachableStopsSearchPhase.Initial);
container.bind<IReachableStopsFinder>(TYPES.ReachableStopsFinder)
  .to(ReachableStopsFinderFootpathsVerbose).whenTargetTagged("phase", ReachableStopsSearchPhase.Transfer);
container.bind<IReachableStopsFinder>(TYPES.ReachableStopsFinder)
  .to(ReachableStopsFinderDelaunay).whenTargetTagged("phase", ReachableStopsSearchPhase.Final);

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

container.bind<RoutableTileRegistry>(TYPES.RoutableTileRegistry).to(RoutableTileRegistry).inSingletonScope();
container.bind<IRoutableTileFetcher>(TYPES.RoutableTileFetcher).to(RoutableTileFetcherRaw).inSingletonScope();
container.bind<IRoutableTileProvider>(TYPES.RoutableTileProvider)
  .to(RoutableTileProviderDefault).inSingletonScope().whenTargetTagged("phase", RoutingPhase.Base);
container.bind<IRoutableTileProvider>(TYPES.RoutableTileProvider)
  .to(RoutableTileProviderTransit).inSingletonScope().whenTargetTagged("phase", RoutingPhase.Transit);

// Bind catalog
const combined = Catalog.combine(catalogNmbs, catalogDeLijn);
container.bind<Catalog>(TYPES.Catalog).toConstantValue(combined);

// Init LDFetch
container.bind<LDFetch>(TYPES.LDFetch).to(LDFetch).inSingletonScope();

container.bind<LDLoader>(TYPES.LDLoader).to(LDLoader);

export default container;
