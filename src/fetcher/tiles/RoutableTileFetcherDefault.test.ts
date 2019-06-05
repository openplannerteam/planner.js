import "jest";
import LDFetch from "ldfetch";
import RoutableTileRegistry from "../../entities/tiles/registry";
import PathfinderProvider from "../../pathfinding/PathfinderProvider";
import ProfileProvider from "../../profile/ProfileProvider";
import RoutableTileFetcherDefault from "./RoutableTileFetcherDefault";

const registry = new RoutableTileRegistry();
const profileProvider = new ProfileProvider();
const fetcher = new RoutableTileFetcherDefault(
  new LDFetch({ headers: { Accept: "application/ld+json" } }),
  new PathfinderProvider(undefined, undefined, registry, profileProvider),
  registry);

test("[RoutableTileFetcherDefault] data completeness", async () => {
  jest.setTimeout(15000);

  const expectedNodes = new Set();
  const tile = await fetcher.get("https://tiles.openplanner.team/planet/14/8361/5482/");
  for (const wayId of tile.getWays()) {
    const way = registry.getWay(wayId);
    for (const segment of way.segments) {
      for (const node of segment) {
        expectedNodes.add(node);
      }
    }
  }

  for (const id of expectedNodes) {
    expect(tile.getNodes().has(id));
  }
});
