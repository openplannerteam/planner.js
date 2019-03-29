import "jest";
import LDFetch from "ldfetch";
import RoutableTileFetcherDefault from "./RoutableTilesFetcherDefault";

const fetcher = new RoutableTileFetcherDefault(new LDFetch({ headers: { Accept: "application/ld+json" } }));

test("[RoutableTileLDFetch] data completeness", async () => {
  jest.setTimeout(15000);

  const expectedNodes = new Set();
  const tile = await fetcher.get("https://tiles.openplanner.team/planet/14/8361/5482/");
  for (const way of Object.values(tile.ways)) {
    for (const segment of way.segments) {
      for (const node of segment) {
        expectedNodes.add(node);
      }
    }
  }

  for (const id of expectedNodes) {
    expect(tile.nodes[id]).toBeDefined();
  }
});
