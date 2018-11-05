import { Container } from "inversify";
import Context from "./Context";
import IConnectionsFetcher from "./fetcher/connections/IConnectionsFetcher";
import ConnectionsFetcherDeLijn from "./fetcher/connections/ld-fetch/ConnectionsFetcherDeLijn";
import ConnectionsFetcherNMBS from "./fetcher/connections/ld-fetch/ConnectionsFetcherNMBS";
import ConnectionsFetcherMerge from "./fetcher/connections/merge/ConnectionsFetcherMerge";
import IStopsFetcher from "./fetcher/stops/IStopsFetcher";
import IStopsFetcherMediator from "./fetcher/stops/IStopsFetcherMediator";
import StopsFetcherDeLijn from "./fetcher/stops/ld-fetch/StopsFetcherDeLijn";
import StopsFetcherNMBS from "./fetcher/stops/ld-fetch/StopsFetcherNMBS";
import StopsFetcherProxy from "./fetcher/stops/proxy/StopsFetcherProxy";
import IPublicTransportPlanner from "./planner/public-transport/IPublicTransportPlanner";
import PublicTransportPlannerCSAProfile from "./planner/public-transport/PublicTransportPlannerCSAProfile";
import IRoadPlanner from "./planner/road/IRoadPlanner";
import RoadPlannerBirdsEye from "./planner/road/RoadPlannerBirdsEye";
import ILocationResolver from "./query-runner/ILocationResolver";
import IQueryRunner from "./query-runner/IQueryRunner";
import LocationResolverDefault from "./query-runner/LocationResolverDefault";
import QueryRunnerDefault from "./query-runner/QueryRunnerDefault";
import TYPES from "./types";

const container = new Container();
container.bind<Context>(TYPES.Context).to(Context).inSingletonScope();
container.bind<IQueryRunner>(TYPES.QueryRunner).to(QueryRunnerDefault);
container.bind<ILocationResolver>(TYPES.LocationResolver).to(LocationResolverDefault);

container.bind<IPublicTransportPlanner>(TYPES.PublicTransportPlanner).to(PublicTransportPlannerCSAProfile);
container.bind<IRoadPlanner>(TYPES.RoadPlanner).to(RoadPlannerBirdsEye);

container.bind<IConnectionsFetcher>(TYPES.ConnectionsFetcher).to(ConnectionsFetcherNMBS);

/*container.bind<IConnectionsFetcher>(TYPES.ConnectionsFetcher)
  .to(ConnectionsFetcherNMBS).whenTargetTagged("type", "source");
container.bind<IConnectionsFetcher>(TYPES.ConnectionsFetcher)
  .to(ConnectionsFetcherDeLijn).whenTargetTagged("type", "source");
container.bind<IConnectionsFetcher>(TYPES.ConnectionsFetcher)
  .to(ConnectionsFetcherMerge).whenTargetTagged("type", "merge");*/

container.bind<IStopsFetcher>(TYPES.StopsFetcher).to(StopsFetcherNMBS);
container.bind<IStopsFetcher>(TYPES.StopsFetcher).to(StopsFetcherDeLijn);
container.bind<IStopsFetcherMediator>(TYPES.StopsFetcherMediator).to(StopsFetcherProxy);

export default container;
