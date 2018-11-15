import "jest";
import StopsFetcherNMBS from "../../fetcher/stops/ld-fetch/StopsFetcherNMBS";
import Units from "../../util/Units";
import RoadPlannerBirdsEye from "../road/RoadPlannerBirdsEye";
import ReachableStopsFinderMode from "./ReachableStopsFinderMode";
import ReachableStopsFinderRoadPlanner from "./ReachableStopsFinderRoadPlanner";

const stopsFetcher = new StopsFetcherNMBS();
const roadPlanner = new RoadPlannerBirdsEye();
const reachableStopsFinder = new ReachableStopsFinderRoadPlanner(stopsFetcher, roadPlanner);

test("[ReachableStopsFinderRoadPlanner] reachable stops", async () => {

  const sourceStop = await stopsFetcher.getStopById("http://irail.be/stations/NMBS/008896008");

  expect(sourceStop).toBeDefined();

  // Get reachable stops in 50 km (10h at 5km/h)
  const reachableStops = await reachableStopsFinder.findReachableStops(
    sourceStop,
    ReachableStopsFinderMode.Source,
    Units.fromHours(1),
    5,
  );

  expect(reachableStops.length).toBeGreaterThan(1);
});
