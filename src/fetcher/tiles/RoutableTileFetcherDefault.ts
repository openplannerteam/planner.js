import { inject, injectable } from "inversify";
import LDFetch from "ldfetch";
import { IRoutableTileNodeIndex, RoutableTileNode } from "../../entities/tiles/node";
import RoutableTileRegistry from "../../entities/tiles/registry";
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
  protected routableTileRegistry: RoutableTileRegistry;

  constructor(
    @inject(TYPES.LDFetch) ldFetch: LDFetch,
    @inject(TYPES.PathfinderProvider) pathfinderProvider: PathfinderProvider,
    @inject(TYPES.RoutableTileRegistry) routableTileRegistry: RoutableTileRegistry,
  ) {
    this.ldFetch = ldFetch;
    this.ldLoader = new LDLoader();
    this.ldLoader.defineCollection(URI.inNS(OSM, "hasNodes")); // unordered collection
    this.pathfinderProvider = pathfinderProvider;
    this.routableTileRegistry = routableTileRegistry;
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

    return this.processTileData(url, nodes, ways);
  }

  protected processTileData(url: string, nodes: IRoutableTileNodeIndex, ways: IRoutableTileWayIndex) {
    this.pathfinderProvider.registerEdges(ways, nodes);

    for (const node of Object.values(nodes)) {
      this.routableTileRegistry.registerNode(node);
    }

    for (const way of Object.values(ways)) {
      this.routableTileRegistry.registerWay(way);
    }

    return new RoutableTile(url, new Set(Object.keys(nodes)), new Set(Object.keys(ways)));
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
    waysView.addMapping(URI.inNS(OSM, "hasNodes"), "segments");
    waysView.addMapping(URI.inNS(OSM, "name"), "name");
    waysView.addMapping(URI.inNS(OSM, "access"), "accessRestrictions");
    waysView.addMapping(URI.inNS(OSM, "bicycle"), "bicycleAccessRestrictions");
    waysView.addMapping(URI.inNS(OSM, "construction"), "constructionKind");
    waysView.addMapping(URI.inNS(OSM, "crossing"), "crossingKind");
    waysView.addMapping(URI.inNS(OSM, "cycleway"), "cyclewayKind");
    waysView.addMapping(URI.inNS(OSM, "footway"), "footwayKind");
    waysView.addMapping(URI.inNS(OSM, "highway"), "highwayKind");
    waysView.addMapping(URI.inNS(OSM, "maxspeed"), "maxSpeed");
    waysView.addMapping(URI.inNS(OSM, "motor_vehicle"), "motorVehicleAccessRestrictions");
    waysView.addMapping(URI.inNS(OSM, "motorcar"), "motorcarAccessRestrictions");
    waysView.addMapping(URI.inNS(OSM, "oneway_bicycle"), "onewayBicycleKind");
    waysView.addMapping(URI.inNS(OSM, "oneway"), "onewayKind");
    waysView.addMapping(URI.inNS(OSM, "smoothness"), "smoothnessKind");
    waysView.addMapping(URI.inNS(OSM, "surface"), "surfaceKind");
    waysView.addMapping(URI.inNS(OSM, "tracktype"), "trackType");
    waysView.addMapping(URI.inNS(OSM, "vehicle"), "vehicleAccessRestrictions");
    return waysView;
  }
}
