import "jest";
import LDFetch from "ldfetch";
import IRoutableTileNode from "../IRoutableTilesNode";
import IRoutableTileWay from "../IRoutableTilesWay";
import RoutableTileNodeFetcherLDFetch from "./RoutableTilesLDFetch";

const TEST_TILE_URLS = [
  "https://tiles.openplanner.team/planet/14/8361/5482/",
];

const ldFetch = new LDFetch({ headers: { Accept: "application/ld+json" } });

const fetcher = new RoutableTileNodeFetcherLDFetch(ldFetch);
fetcher.setAccessUrl(TEST_TILE_URLS[0]);

test("[RoutableTileLDFetch] data completeness", async () => {
  jest.setTimeout(15000);

  const expectedNodes = new Set();
  const ways: IRoutableTileWay[] = await fetcher.getAllWays();
  for (const way of ways) {
    expect(way.nodes).toBeDefined();
    for (const node of way.nodes) {
      expectedNodes.add(node);
    }
  }

  for (const id of expectedNodes) {
    const node: IRoutableTileNode = await fetcher.getNodeById(id);
    expect(node).toBeDefined();
  }
});
