import "jest";
import LDFetch from "ldfetch";
import ReachableStopsFinderMode from "../../enums/ReachableStopsFinderMode";
import StopsFetcherLDFetch from "../../fetcher/stops/ld-fetch/StopsFetcherLDFetch";
import Units from "../../util/Units";
import RoadPlannerBirdsEye from "../road/RoadPlannerBirdsEye";
import ReachableStopsFinderRoadPlanner from "./ReachableStopsFinderRoadPlanner";

const ldFetch = new LDFetch({ headers: { Accept: "application/ld+json" } });

const stopsFetcher = new StopsFetcherLDFetch(ldFetch);
stopsFetcher.setAccessUrl("https://irail.be/stations/NMBS");

const roadPlanner = new RoadPlannerBirdsEye();
const reachableStopsFinder = new ReachableStopsFinderRoadPlanner(stopsFetcher, roadPlanner);

test("[ReachableStopsFinderRoadPlanner] reachable stops", async () => {

  const sourceStop = await stopsFetcher.getStopById("http://irail.be/stations/NMBS/008896008");

  expect(sourceStop).toBeDefined();

  // Get reachable stops in 5 km (1h at 5km/h)
  const reachableStops = await reachableStopsFinder.findReachableStops(
    sourceStop,
    ReachableStopsFinderMode.Source,
    Units.fromHours(1),
    5,
    "https://hdelva.be/profile/pedestrian",
  );

  expect(reachableStops.length).toBeGreaterThan(1);
});
