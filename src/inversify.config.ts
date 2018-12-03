import { Container, interfaces } from "inversify";
import LDFetch from "ldfetch";
import Catalog from "./Catalog";
import Context from "./Context";
import ConnectionsProviderPassthrough from "./fetcher/connections/ConnectionsProviderPassthrough";
import IConnectionsFetcher from "./fetcher/connections/IConnectionsFetcher";
import IConnectionsProvider from "./fetcher/connections/IConnectionsProvider";
import ConnectionsFetcherLazy from "./fetcher/connections/ld-fetch/ConnectionsFetcherLazy";
import IStopsFetcher from "./fetcher/stops/IStopsFetcher";
import IStopsProvider from "./fetcher/stops/IStopsProvider";
import StopsFetcherLDFetch from "./fetcher/stops/ld-fetch/StopsFetcherLDFetch";
import StopsProviderDefault from "./fetcher/stops/StopsProviderDefault";
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
import QueryRunnerExponential from "./query-runner/exponential/QueryRunnerExponential";
import ILocationResolver from "./query-runner/ILocationResolver";
import IQueryRunner from "./query-runner/IQueryRunner";
import LocationResolverDefault from "./query-runner/LocationResolverDefault";
import TravelMode from "./TravelMode";
import TYPES from "./types";

const container = new Container();
container.bind<Context>(TYPES.Context).to(Context).inSingletonScope();
container.bind<IQueryRunner>(TYPES.QueryRunner).to(QueryRunnerExponential);
container.bind<ILocationResolver>(TYPES.LocationResolver).to(LocationResolverDefault);

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

container.bind<IConnectionsProvider>(TYPES.ConnectionsProvider).to(ConnectionsProviderPassthrough).inSingletonScope();
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
      (prefix: string, accessUrl: string) => {
        const fetcher = context.container.get<StopsFetcherLDFetch>(TYPES.StopsFetcher);

        fetcher.setPrefix(prefix);
        fetcher.setAccessUrl(accessUrl);

        return fetcher;
      },
  );

// Init catalog
// const catalog = new Catalog();
// catalog.addStopsFetcher("http://irail.be/stations/NMBS/", "https://irail.be/stations/NMBS");
// catalog.addConnectionsFetcher("https://graph.irail.be/sncb/connections", TravelMode.Train);

const catalog = new Catalog();
catalog.addStopsFetcher(
  "https://data.delijn.be/stops/",
  "https://openplanner.ilabt.imec.be/delijn/Oost-Vlaanderen/stops",
);
catalog.addConnectionsFetcher("https://openplanner.ilabt.imec.be/delijn/Oost-Vlaanderen/connections", TravelMode.Bus);

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
