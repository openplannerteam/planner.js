import "jest";
import LDFetch from "ldfetch";
import RoutableTileRegistry from "../../entities/tiles/registry";
import PathfinderProvider from "../../pathfinding/PathfinderProvider";
import LocationResolverConvenience from "../../query-runner/LocationResolverConvenience";
import ProfileFetcherDefault from "../profiles/ProfileFetcherDefault";
import ProfileProviderDefault from "../profiles/ProfileProviderDefault";
import RoutableTileFetcherDefault from "./RoutableTileFetcherDefault";

const ldfetch = new LDFetch({ headers: { Accept: "application/ld+json" } });
const profileProvider = new ProfileProviderDefault(new ProfileFetcherDefault(ldfetch));
const locationResolver = new LocationResolverConvenience(null);
const fetcher = new RoutableTileFetcherDefault(
  ldfetch,
  new PathfinderProvider(undefined, undefined, profileProvider, locationResolver));

const registry = RoutableTileRegistry.getInstance();

test("[RoutableTileFetcherDefault] data completeness", async () => {
  jest.setTimeout(15000);

  const expectedNodes: Set<string> = new Set();
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
