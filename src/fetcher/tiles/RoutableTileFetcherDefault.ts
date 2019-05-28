import { inject, injectable } from "inversify";
import LDFetch from "ldfetch";
import { IRoutableTileNodeIndex, RoutableTileNode } from "../../entities/tiles/node";
import { RoutableTile } from "../../entities/tiles/tile";
import { IRoutableTileWayIndex, RoutableTileWay } from "../../entities/tiles/way";
import { LDLoader } from "../../loader/ldloader";
import { IndexThingView } from "../../loader/views";
import PathfinderProvider from "../../pathfinding/PathfinderProvider";
import TYPES from "../../types";
import { GEO, OSM, RDF, RDFS } from "../../uri/constants";
import URI from "../../uri/uri";
import IRoutableTileFetcher from "./IRoutableTileFetcher";

@injectable()
export default class RoutableTileFetcherDefault implements IRoutableTileFetcher {

  protected ldFetch: LDFetch;
  protected ldLoader: LDLoader;
  protected pathfinderProvider: PathfinderProvider;

  constructor(
    @inject(TYPES.LDFetch) ldFetch: LDFetch,
    @inject(TYPES.PathfinderProvider) pathfinderProvider: PathfinderProvider,
  ) {
    this.ldFetch = ldFetch;
    this.ldLoader = new LDLoader();
    this.ldLoader.defineCollection(URI.inNS(OSM, "nodes")); // unordered collection
    this.pathfinderProvider = pathfinderProvider;
  }

  public async get(url: string): Promise<RoutableTile> {
    const rdfThing = await this.ldFetch.get(url);
    const triples = rdfThing.triples;

    let nodes: IRoutableTileNodeIndex;
    let ways: IRoutableTileWayIndex;

    [nodes, ways] = this.ldLoader.process(triples, [
      this.getNodesView(),
      this.getWaysView(),
    ]);

    this.pathfinderProvider.registerEdges(ways, nodes);

    return new RoutableTile(url, nodes, ways);
  }

  protected getNodesView() {
    const nodesView = new IndexThingView(RoutableTileNode.create);
    nodesView.addFilter((entity) =>
      entity[URI.inNS(GEO, "lat")] !== undefined && entity[URI.inNS(GEO, "long")] !== undefined,
    );
    nodesView.addMapping(URI.inNS(GEO, "lat"), "latitude");
    nodesView.addMapping(URI.inNS(GEO, "long"), "longitude");
    return nodesView;
  }

  protected getWaysView() {
    const waysView = new IndexThingView(RoutableTileWay.create);
    waysView.addFilter((entity) =>
      entity[URI.inNS(RDF, "type")] === URI.inNS(OSM, "Way"),
    );
    waysView.addMapping(URI.inNS(OSM, "nodes"), "segments"); // todo mapping to segments
    waysView.addMapping(URI.inNS(RDFS, "label"), "label");
    return waysView;
  }
}
