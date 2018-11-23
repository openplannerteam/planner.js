import { Container, interfaces } from "inversify";
import LDFetch from "ldfetch";
import Catalog from "./Catalog";
import Context from "./Context";
import IConnectionsFetcher from "./fetcher/connections/IConnectionsFetcher";
import ConnectionsFetcherNMBS from "./fetcher/connections/ld-fetch/ConnectionsFetcherNMBS";
import IStopsFetcher from "./fetcher/stops/IStopsFetcher";
import IStopsProvider from "./fetcher/stops/IStopsProvider";
import StopsFetcherLDFetch from "./fetcher/stops/ld-fetch/StopsFetcherLDFetch";
import StopsProvider from "./fetcher/stops/StopsProvider";
import IJourneyExtractor from "./planner/public-transport/IJourneyExtractor";
import IPublicTransportPlanner from "./planner/public-transport/IPublicTransportPlanner";
import JourneyExtractionPhase from "./planner/public-transport/JourneyExtractionPhase";
import JourneyExtractorDefault from "./planner/public-transport/JourneyExtractorDefault";
import PublicTransportPlannerCSAProfile from "./planner/public-transport/PublicTransportPlannerCSAProfile";
import IRoadPlanner from "./planner/road/IRoadPlanner";
import RoadPlannerBirdsEye from "./planner/road/RoadPlannerBirdsEye";
import IReachableStopsFinder from "./planner/stops/IReachableStopsFinder";
import ReachableStopsFinderBirdsEyeCached from "./planner/stops/ReachableStopsFinderBirdsEyeCached";
import ReachableStopsSearchPhase from "./planner/stops/ReachableStopsSearchPhase";
import ILocationResolver from "./query-runner/ILocationResolver";
import IQueryRunner from "./query-runner/IQueryRunner";
import LocationResolverDefault from "./query-runner/LocationResolverDefault";
import QueryRunnerDefault from "./query-runner/QueryRunnerDefault";
import TYPES from "./types";

const container = new Container();
container.bind<Context>(TYPES.Context).to(Context).inSingletonScope();
container.bind<IQueryRunner>(TYPES.QueryRunner).to(QueryRunnerDefault);
container.bind<ILocationResolver>(TYPES.LocationResolver).to(LocationResolverDefault);

container.bind<IRoadPlanner>(TYPES.RoadPlanner)
  .to(RoadPlannerBirdsEye).whenTargetNamed("base");
container.bind<IPublicTransportPlanner>(TYPES.PublicTransportPlanner)
  .to(PublicTransportPlannerCSAProfile);

container.bind<IJourneyExtractor>(TYPES.JourneyExtractor)
  .to(JourneyExtractorDefault);
container.bind<IRoadPlanner>(TYPES.RoadPlanner)
  .to(RoadPlannerBirdsEye).whenTargetTagged("phase", JourneyExtractionPhase.Initial);
container.bind<IRoadPlanner>(TYPES.RoadPlanner)
  .to(RoadPlannerBirdsEye).whenTargetTagged("phase", JourneyExtractionPhase.Transfer);
container.bind<IRoadPlanner>(TYPES.RoadPlanner)
  .to(RoadPlannerBirdsEye).whenTargetTagged("phase", JourneyExtractionPhase.Final);

container.bind<IReachableStopsFinder>(TYPES.ReachableStopsFinder)
  .to(ReachableStopsFinderBirdsEyeCached).whenTargetTagged("phase", ReachableStopsSearchPhase.Initial);
container.bind<IReachableStopsFinder>(TYPES.ReachableStopsFinder)
  .to(ReachableStopsFinderBirdsEyeCached).whenTargetTagged("phase", ReachableStopsSearchPhase.Transfer);
container.bind<IReachableStopsFinder>(TYPES.ReachableStopsFinder)
  .to(ReachableStopsFinderBirdsEyeCached).whenTargetTagged("phase", ReachableStopsSearchPhase.Final);

container.bind<IConnectionsFetcher>(TYPES.ConnectionsFetcher).to(ConnectionsFetcherNMBS);

/*container.bind<IConnectionsFetcher>(TYPES.ConnectionsFetcher)
  .to(ConnectionsFetcherNMBS).whenTargetTagged("type", "source");
container.bind<IConnectionsFetcher>(TYPES.ConnectionsFetcher)
  .to(ConnectionsFetcherDeLijn).whenTargetTagged("type", "source");
container.bind<IConnectionsFetcher>(TYPES.ConnectionsFetcher)
  .to(ConnectionsFetcherMerge).whenTargetTagged("type", "merge");*/

// container.bind<IStopsFetcher>(TYPES.StopsFetcher).to(StopsFetcherDeLijn).inSingletonScope();
container.bind<IStopsProvider>(TYPES.StopsProvider).to(StopsProvider).inSingletonScope();
container.bind<interfaces.Factory<IStopsFetcher>>(TYPES.StopsFetcherFactory)
  .toFactory<IStopsFetcher>(
    () => (prefix: string, accessUrl: string) => new StopsFetcherLDFetch(prefix, [accessUrl]),
  );

// Init catalog
const catalog = new Catalog();
catalog.addStopsFetcher("http://irail.be/stations/NMBS/", "https://irail.be/stations/NMBS");

container.bind<Catalog>(TYPES.Catalog).toConstantValue(catalog);

// Init LDFetch
const ldFetch = new LDFetch({ headers: { Accept: "application/ld+json" } });
const httpStartTimes = {};

ldFetch.on("request", (url) => httpStartTimes[url] = new Date());

ldFetch.on("redirect", (obj) => httpStartTimes[obj.to] = httpStartTimes[obj.from]);

ldFetch.on("response", (url) => {
  const difference = (new Date()).getTime() - httpStartTimes[url].getTime();
  console.log(`HTTP GET - ${url} (${difference}ms)`);
});

container.bind<LDFetch>(TYPES.LDFetch).toConstantValue(ldFetch);

export default container;
