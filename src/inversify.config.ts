import { Container } from "inversify";
import Context from "./Context";
import IConnectionsFetcher from "./fetcher/connections/IConnectionsFetcher";
import ConnectionsFetcherNMBS from "./fetcher/connections/ld-fetch/ConnectionsFetcherNMBS";
import IStopsFetcher from "./fetcher/stops/IStopsFetcher";
import IStopsFetcherMediator from "./fetcher/stops/IStopsFetcherMediator";
import StopsFetcherDeLijn from "./fetcher/stops/ld-fetch/StopsFetcherDeLijn";
import StopsFetcherNMBS from "./fetcher/stops/ld-fetch/StopsFetcherNMBS";
import StopsFetcherProxy from "./fetcher/stops/proxy/StopsFetcherProxy";
import IJourneyExtractor from "./planner/public-transport/IJourneyExtractor";
import IPublicTransportPlanner from "./planner/public-transport/IPublicTransportPlanner";
import JourneyExtractorDefault from "./planner/public-transport/JourneyExtractorDefault";
import PublicTransportPlannerCSAProfile from "./planner/public-transport/PublicTransportPlannerCSAProfile";
import IRoadPlanner from "./planner/road/IRoadPlanner";
import RoadPlannerBirdsEye from "./planner/road/RoadPlannerBirdsEye";
import RoadPlannerPhase from "./planner/road/RoadPlannerPhase";
import IReachableStopsFinder from "./planner/stops/IReachableStopsFinder";
import ReachableStopsFinderBirdsEyeCached from "./planner/stops/ReachableStopsFinderBirdsEyeCached";
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

// container.bind<IRoadPlanner>(TYPES.RoadPlanner)
//   .to(RoadPlannerBirdsEye).whenTargetTagged("phase", RoadPlannerPhase.ReachableStopsSearchInitial);
// container.bind<IRoadPlanner>(TYPES.RoadPlanner)
//   .to(RoadPlannerBirdsEye).whenTargetTagged("phase", RoadPlannerPhase.ReachableStopsSearchTransfer);
// container.bind<IRoadPlanner>(TYPES.RoadPlanner)
//   .to(RoadPlannerBirdsEye).whenTargetTagged("phase", RoadPlannerPhase.ReachableStopsSearchFinal);
//
// container.bind<IRoadPlanner>(TYPES.RoadPlanner)
//   .to(RoadPlannerBirdsEye).whenTargetTagged("phase", RoadPlannerPhase.JourneyExtractionInitial);
// container.bind<IRoadPlanner>(TYPES.RoadPlanner)
//   .to(RoadPlannerBirdsEye).whenTargetTagged("phase", RoadPlannerPhase.JourneyExtractionTransfer);
// container.bind<IRoadPlanner>(TYPES.RoadPlanner)
//   .to(RoadPlannerBirdsEye).whenTargetTagged("phase", RoadPlannerPhase.JourneyExtractionFinal);

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

container.bind<IReachableStopsFinder>(TYPES.ReachableStopsFinder).to(ReachableStopsFinderBirdsEyeCached);
container.bind<IJourneyExtractor>(TYPES.JourneyExtractor).to(JourneyExtractorDefault);

export default container;
