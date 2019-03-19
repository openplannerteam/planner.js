import "isomorphic-fetch";
import "reflect-metadata";
import Planner from "./Planner";

export default Planner;

import "jest";
import LDFetch from "ldfetch";
import RoutableTileNodeFetcherLDFetch from "./fetcher/tiles/ld-fetch/RoutableTilesLDFetch";

const TEST_TILE_URLS = [
  "https://tiles.openplanner.team/planet/14/8361/5482/",
];

const ldFetch = new LDFetch({ headers: { Accept: "application/ld+json" } });

const fetcher = new RoutableTileNodeFetcherLDFetch(ldFetch);
fetcher.setAccessUrl(TEST_TILE_URLS[0]);

const expectedNodes = new Set();
fetcher.getAllWays().then((ways) => {
  for (const way of ways) {
    if (!way.nodes) {
      const x = 9;
    }
    for (const node of way.nodes) {
      expectedNodes.add(node);
    }
  }
}).then(() => {
  for (const node of expectedNodes) {
    fetcher.getNodeById(node).then((result) => {
      if (!result) {
        const x = 9;
      }
    });
  }
});

/*
import "jest";
import LDFetch from "ldfetch";
import IStop from "./fetcher/stops/IStop";
import StopsFetcherLDFetch from "./fetcher/stops/ld-fetch/StopsFetcherLDFetch";

const DE_LIJN_STOPS_URLS = [
  "http://openplanner.ilabt.imec.be/delijn/Antwerpen/stops",
  "http://openplanner.ilabt.imec.be/delijn/Oost-Vlaanderen/stops",
  "http://openplanner.ilabt.imec.be/delijn/West-Vlaanderen/stops",
  "http://openplanner.ilabt.imec.be/delijn/Vlaams-Brabant/stops",
  "http://openplanner.ilabt.imec.be/delijn/Limburg/stops",
];

const ldFetch = new LDFetch({ headers: { Accept: "application/ld+json" } });

const deLijnFetcher = new StopsFetcherLDFetch(ldFetch);
deLijnFetcher.setAccessUrl(DE_LIJN_STOPS_URLS[2]);

deLijnFetcher.getStopById("https://data.delijn.be/stops/590009").then((v) => {
  const stop: IStop = v;
  console.log(stop);
});

*/
