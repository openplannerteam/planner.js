import "jest";
import LDFetch from "ldfetch";
import { Dijkstra } from "../../pathfinding/dijkstra/dijkstra-js";
import RoutableTileFetcherDefault from "./RoutableTileFetcherDefault";

const fetcher = new RoutableTileFetcherDefault(new LDFetch({ headers: { Accept: "application/ld+json" } }),
  new Dijkstra());

test("[RoutableTileFetcherDefault] data completeness", async () => {
  jest.setTimeout(15000);

  const expectedNodes = new Set();
  const tile = await fetcher.get("https://tiles.openplanner.team/planet/14/8361/5482/");
  for (const way of Object.values(tile.getWays())) {
    for (const segment of way.segments) {
      for (const node of segment) {
        expectedNodes.add(node);
      }
    }
  }

  for (const id of expectedNodes) {
    expect(tile.getNodes()[id]).toBeDefined();
  }
});
