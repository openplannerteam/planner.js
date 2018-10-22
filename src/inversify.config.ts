import { Container } from "inversify";
import ConnectionsFetcherLDFetch from "./fetcher/connections/ConnectionsFetcherLDFetch";
import TYPES from "./types";
import PublicTransportPlannerCSAProfile from "./planner/public-transport/PublicTransportPlannerCSAProfile";
import IConnectionsFetcher from "./fetcher/connections/IConnectionsFetcher";
import IPublicTransportPlanner from "./planner/public-transport/IPublicTransportPlanner";
import IRoadPlanner from "./planner/road/IRoadPlanner";
import RoadPlannerBirdsEye from "./planner/road/RoadPlannerBirdsEye";
import Context from "./Context";
import IQueryRunner from "./query-runner/IQueryRunner";
import QueryRunnerDefault from "./query-runner/QueryRunnerDefault";


const container = new Container();
container.bind<Context>(TYPES.Context).to(Context);
container.bind<IQueryRunner>(TYPES.QueryRunner).to(QueryRunnerDefault);
container.bind<IPublicTransportPlanner>(TYPES.PublicTransportPlanner).to(PublicTransportPlannerCSAProfile);
container.bind<IRoadPlanner>(TYPES.RoadPlanner).to(RoadPlannerBirdsEye);
container.bind<IConnectionsFetcher>(TYPES.ConnectionsFetcher).to(ConnectionsFetcherLDFetch);

export default container;
