import "jest";
import LDFetch from "ldfetch";
import ReachableStopsFinderMode from "../../enums/ReachableStopsFinderMode";
import StopsFetcherLDFetch from "../../fetcher/stops/ld-fetch/StopsFetcherLDFetch";
import Units from "../../util/Units";
import ReachableStopsFinderBirdsEye from "./ReachableStopsFinderBirdsEye";

const DE_LIJN_STOPS_URLS = [
  "http://openplanner.ilabt.imec.be/delijn/Antwerpen/stops",
  "http://openplanner.ilabt.imec.be/delijn/Oost-Vlaanderen/stops",
  "http://openplanner.ilabt.imec.be/delijn/West-Vlaanderen/stops",
  "http://openplanner.ilabt.imec.be/delijn/Vlaams-Brabant/stops",
  "http://openplanner.ilabt.imec.be/delijn/Limburg/stops",
];

const ldFetch = new LDFetch({ headers: { Accept: "application/ld+json" } });

const stopsFetcher = new StopsFetcherLDFetch(ldFetch);
stopsFetcher.setAccessUrl(DE_LIJN_STOPS_URLS[2]);

const reachableStopsFinder = new ReachableStopsFinderBirdsEye(stopsFetcher);

test("[ReachableStopsFinderBirdsEye] reachable stops", async () => {
  jest.setTimeout(15000);

  // Vierweg in West-Vlaanderen
  const sourceStop = await stopsFetcher.getStopById("https://data.delijn.be/stops/590009");

  expect(sourceStop).toBeDefined();

  // Get reachable stops in 1 km (.25h at 4km/h)
  const reachableStops = await reachableStopsFinder.findReachableStops(
    sourceStop,
    ReachableStopsFinderMode.Source,
    Units.fromMinutes(15),
    4,
  );

  expect(reachableStops.length).toBeGreaterThan(1);
});
