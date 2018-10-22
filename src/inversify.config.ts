import { Container } from "inversify";
import Context from "./Context";
import ConnectionsFetcherLDFetch from "./fetcher/connections/ConnectionsFetcherLDFetch";
import IConnectionsFetcher from "./fetcher/connections/IConnectionsFetcher";
import IStopsFetcher from "./fetcher/stops/IStopsFetcher";
import StopsFetcherNMBS from "./fetcher/stops/StopsFetcherNMBS";
import IPublicTransportPlanner from "./planner/public-transport/IPublicTransportPlanner";
import PublicTransportPlannerCSAProfile from "./planner/public-transport/PublicTransportPlannerCSAProfile";
import IRoadPlanner from "./planner/road/IRoadPlanner";
import RoadPlannerBirdsEye from "./planner/road/RoadPlannerBirdsEye";
import IQueryRunner from "./query-runner/IQueryRunner";
import QueryRunnerDefault from "./query-runner/QueryRunnerDefault";
import TYPES from "./types";

const container = new Container();
container.bind<Context>(TYPES.Context).to(Context);
container.bind<IQueryRunner>(TYPES.QueryRunner).to(QueryRunnerDefault);
container.bind<IPublicTransportPlanner>(TYPES.PublicTransportPlanner).to(PublicTransportPlannerCSAProfile);
container.bind<IRoadPlanner>(TYPES.RoadPlanner).to(RoadPlannerBirdsEye);
container.bind<IConnectionsFetcher>(TYPES.ConnectionsFetcher).to(ConnectionsFetcherLDFetch);
container.bind<IStopsFetcher>(TYPES.StopsFetcher).to(StopsFetcherNMBS);

export default container;
