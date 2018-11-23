import "jest";
import Units from "../../util/Units";
import ReachableStopsFinderBirdsEye from "./ReachableStopsFinderBirdsEye";
import ReachableStopsFinderMode from "./ReachableStopsFinderMode";
import IStopsFetcher from "../../fetcher/stops/IStopsFetcher";
import StopsFetcherLDFetch from "../../fetcher/stops/ld-fetch/StopsFetcherLDFetch";

const DE_LIJN_STOPS_URLS = [
  "http://openplanner.ilabt.imec.be/delijn/Antwerpen/stops",
  "http://openplanner.ilabt.imec.be/delijn/Oost-Vlaanderen/stops",
  "http://openplanner.ilabt.imec.be/delijn/West-Vlaanderen/stops",
  "http://openplanner.ilabt.imec.be/delijn/Vlaams-Brabant/stops",
  "http://openplanner.ilabt.imec.be/delijn/Limburg/stops",
];

const stopsFetcher: IStopsFetcher = new StopsFetcherLDFetch(
  "https://data.delijn.be/stops/",
  DE_LIJN_STOPS_URLS,
);

const reachableStopsFinder = new ReachableStopsFinderBirdsEye(stopsFetcher);

test("[ReachableStopsFinderBirdsEye] reachable stops", async () => {
  jest.setTimeout(15000);

  const sourceStop = await stopsFetcher.getStopById("https://data.delijn.be/stops/590009");

  expect(sourceStop).toBeDefined();

  // Get reachable stops in 1 km (.25h at 4km/h)
  const reachableStops = await reachableStopsFinder.findReachableStops(
    sourceStop,
    ReachableStopsFinderMode.Source,
    Units.fromHours(0.25),
    4,
  );

  expect(reachableStops.length).toBeGreaterThan(1);
});
