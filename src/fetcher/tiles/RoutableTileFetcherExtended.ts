import { inject, injectable } from "inversify";
import LDFetch from "ldfetch";
import { RoutableTile } from "../../entities/tiles/tile";
import PathfinderProvider from "../../pathfinding/PathfinderProvider";
import TYPES from "../../types";
import { ROUTE } from "../../uri/constants";
import URI from "../../uri/uri";
import RoutableTileFetcherDefault from "./RoutableTileFetcherDefault";

@injectable()
export default class RoutableTileFetcherExtended extends RoutableTileFetcherDefault {

  constructor(
    @inject(TYPES.LDFetch) ldFetch: LDFetch,
    @inject(TYPES.PathfinderProvider) pathfinder: PathfinderProvider,
  ) {
    super(ldFetch, pathfinder);
  }

  public async get(url: string): Promise<RoutableTile> {
    const lolJs = url.split("/");
    const tileX = lolJs[lolJs.length - 2];
    const tileY = lolJs[lolJs.length - 1];
    const otherUrl = `https://www.hdelva.be/tiles/inferred/${tileX}/${tileY}`;

    const basePromise = this.ldFetch.get(url);
    const otherPromise = this.ldFetch.get(otherUrl);

    const baseResponse = await basePromise;
    const baseTriples = baseResponse.triples;

    let otherTriples = [];
    try {
      const otherResponse = await otherPromise;
      otherTriples = otherResponse.triples;

      this.ldLoader.disambiguateBlankNodes(baseTriples, "base");
      this.ldLoader.disambiguateBlankNodes(otherTriples, "other");
    } catch {
      // not that important
    }

    const [nodes, ways] = this.ldLoader.process(baseTriples.concat(otherTriples), [
      this.getNodesView(),
      this.getWaysView(),
    ]);

    return this.processTileData(url, nodes, ways);
  }

  protected getWaysView() {
    const original = super.getWaysView();
    original.addMapping(URI.inNS(ROUTE, "reachable"), "reachable");
    return original;
  }
}
