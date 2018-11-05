import "jest";
import StopsFetcherDeLijn from "../../fetcher/stops/ld-fetch/StopsFetcherDeLijn";
import Units from "../../util/Units";
import ReachableStopsFinderBirdsEye from "./ReachableStopsFinderBirdsEye";

const stopsFetcher = new StopsFetcherDeLijn();
const reachableStopsFinder = new ReachableStopsFinderBirdsEye(stopsFetcher);

test("[ReachableStopsFinderBirdsEye] reachable stops", async () => {

  const sourceStop = await stopsFetcher.getStopById("https://data.delijn.be/stops/590009");

  expect(sourceStop).toBeDefined();

  // Get reachable stops in 1 km (.25h at 4km/h)
  const reachableStops = await reachableStopsFinder.findReachableStops(sourceStop, Units.fromHours(0.25), 4);

  expect(reachableStops.length).toBeGreaterThan(1);
});
