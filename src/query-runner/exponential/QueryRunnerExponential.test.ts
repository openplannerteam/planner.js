import "jest";
import LDFetch from "ldfetch";
import TravelMode from "../../enums/TravelMode";
import ConnectionsFetcherRaw from "../../fetcher/connections/ConnectionsFetcherRaw";
import ConnectionsProviderDefault from "../../fetcher/connections/ConnectionsProviderDefault";
import HydraTemplateFetcherDefault from "../../fetcher/hydra/HydraTemplateFetcherDefault";
import StopsFetcherLDFetch from "../../fetcher/stops/ld-fetch/StopsFetcherLDFetch";
import ILeg from "../../interfaces/ILeg";
import IPath from "../../interfaces/IPath";
import CSAProfile from "../../planner/public-transport/CSAProfile";
import JourneyExtractorProfile from "../../planner/public-transport/JourneyExtractorProfile";
import ReachableStopsFinderBirdsEyeCached from "../../planner/stops/ReachableStopsFinderBirdsEyeCached";
import Units from "../../util/Units";
import LocationResolverDefault from "../LocationResolverDefault";
import QueryRunnerExponential from "./QueryRunnerExponential";

describe("[QueryRunnerExponential]", () => {
  jest.setTimeout(300000);

  let publicTransportResult;

  const query = {
    from: "http://irail.be/stations/NMBS/008896925", // Ingelmunster
    to: "http://irail.be/stations/NMBS/008892007", // Ghent-Sint-Pieters
    minimumDepartureTime: new Date(),
    maximumTransferDuration: Units.fromMinutes(30),
  };

  const createExponentialQueryRunner = () => {
    const ldFetch = new LDFetch({ headers: { Accept: "application/ld+json" } });

    const connectionsFetcher = new ConnectionsFetcherRaw();
    const stopsFetcher = new StopsFetcherLDFetch(ldFetch);
    stopsFetcher.setAccessUrl("https://irail.be/stations/NMBS");

    const connectionProvider = new ConnectionsProviderDefault((travelMode: TravelMode) => {
      connectionsFetcher.setTravelMode(travelMode);
      return connectionsFetcher;
    }, new HydraTemplateFetcherDefault(ldFetch));

    connectionProvider.addConnectionSource({
      accessUrl: "https://graph.irail.be/sncb/connections",
      travelMode: TravelMode.Train,
    });

    const locationResolver = new LocationResolverDefault(stopsFetcher);
    const reachableStopsFinder = new ReachableStopsFinderBirdsEyeCached(stopsFetcher);

    const createJourneyExtractor = () => {
      return new JourneyExtractorProfile(
        locationResolver,
      );
    };

    const createPlanner = () => {
      return new CSAProfile(
        connectionProvider,
        locationResolver,
        reachableStopsFinder,
        reachableStopsFinder,
        reachableStopsFinder,
        createJourneyExtractor(),
      );
    };

    return new QueryRunnerExponential(locationResolver, createPlanner, undefined);
  };

  const result: IPath[] = [];

  beforeAll(async (done) => {

    const queryRunner = createExponentialQueryRunner();

    publicTransportResult = await queryRunner.run(query);

    await publicTransportResult.take(3)
      .on("data", (path: IPath) => {
        result.push(path);
      })
      .on("end", () => {
        done();
      });
  });

  it("Correct departure and arrival stop", () => {
    checkStops(result, query);
  });
});

const checkStops = (result: IPath[], query) => {
  expect(result).toBeDefined();
  expect(result.length).toBeGreaterThanOrEqual(1);

  for (const path of result) {
    expect(path.legs).toBeDefined();

    expect(path.legs.length).toBeGreaterThanOrEqual(1);

    let currentLocation = query.from;
    path.legs.forEach((leg: ILeg) => {
      expect(leg).toBeDefined();
      expect(currentLocation).toEqual(leg.getStartLocation().id);
      currentLocation = leg.getStopLocation().id;
    });

    expect(query.to).toEqual(currentLocation);
  }
};
