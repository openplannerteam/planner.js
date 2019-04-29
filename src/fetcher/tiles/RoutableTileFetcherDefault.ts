import { inject, injectable } from "inversify";
import LDFetch from "ldfetch";
import { IRoutableTileNodeIndex, RoutableTileNode } from "../../entities/tiles/node";
import { RoutableTile } from "../../entities/tiles/tile";
import { IRoutableTileWayIndex, RoutableTileWay } from "../../entities/tiles/way";
import { LDLoader } from "../../loader/ldloader";
import { IndexThingView } from "../../loader/views";
import { IPathfinder } from "../../pathfinding/pathfinder";
import TYPES from "../../types";
import { GEO, OSM, RDF, RDFS } from "../../uri/constants";
import URI from "../../uri/uri";
import Geo from "../../util/Geo";
import IRoutableTileFetcher from "./IRoutableTileFetcher";

@injectable()
export default class RoutableTileFetcherDefault implements IRoutableTileFetcher {

  protected ldFetch: LDFetch;
  protected ldLoader: LDLoader;
  protected pathfinder: IPathfinder;

  constructor(
    @inject(TYPES.LDFetch) ldFetch: LDFetch,
    @inject(TYPES.Pathfinder) pathfinder: IPathfinder,
  ) {
    this.ldFetch = ldFetch;
    this.ldLoader = new LDLoader();
    this.ldLoader.defineCollection(URI.inNS(OSM, "nodes")); // unordered collection
    this.pathfinder = pathfinder;
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

    this.registerEdges(ways, nodes);

    return new RoutableTile(url, nodes, ways);
  }

  protected registerEdges(ways: IRoutableTileWayIndex, nodes: IRoutableTileNodeIndex): void {
    for (const way of Object.values(ways)) {
      for (const segment of way.segments) {
        for (let i = 0; i < segment.length - 1; i++) {
          const from  = nodes[segment[i]];
          const to = nodes[segment[i + 1]];
          if (from && to) {
            // todo, shouldn't be needed
            const distance = Geo.getDistanceBetweenLocations(from, to);
            this.pathfinder.addEdge(from.id, to.id, distance);
            this.pathfinder.addEdge(to.id, from.id, distance);
          }
        }
      }
    }
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
