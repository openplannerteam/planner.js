import { inject, injectable } from "inversify";
import LDFetch from "ldfetch";
import { IRoutableTileNodeIndex, RoutableTileNode } from "../../entities/tiles/node";
import { RoutableTile } from "../../entities/tiles/tile";
import { IRoutableTileWayIndex, RoutableTileWay } from "../../entities/tiles/way";
import { LDLoader } from "../../loader/ldloader";
import { IndexThingView } from "../../loader/views";
import TYPES from "../../types";
import { GEO, OSM, RDF, RDFS } from "../../uri/constants";
import URI from "../../uri/uri";
import IRoutableTilesFetcher from "./IRoutableTilesFetcher";

@injectable()
export default class RoutableTileFetcherDefault implements IRoutableTilesFetcher {

  private ldFetch: LDFetch;
  private ldLoader: LDLoader;

  constructor(
    @inject(TYPES.LDFetch) ldFetch: LDFetch,
  ) {
    this.ldFetch = ldFetch;
    this.ldLoader = new LDLoader();
    this.ldLoader.defineCollection(URI.inNS(OSM, "nodes")); // unordered collection
  }

  public fetchByCoords(zoom: number, latitude: number, longitude: number): Promise<RoutableTile> {
    const latitudeTile = this.lat2tile(latitude, zoom);
    const longitudeTile = this.long2tile(longitude, zoom);
    return this.fetchByTileCoords(zoom, latitudeTile, longitudeTile);
  }

  public async fetchByTileCoords(zoom: number, latitudeTile: number, longitudeTile: number): Promise<RoutableTile> {
    const url = `https://tiles.openplanner.team/planet/${zoom}/${latitudeTile}/${longitudeTile}`;
    const tile = await this.get(url);
    tile.latitude = latitudeTile;  // todo, move these
    tile.longitude = longitudeTile;
    return tile;
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

    return new RoutableTile(url, nodes, ways);
  }

  private getNodesView() {
    const nodesView = new IndexThingView(RoutableTileNode.create);
    nodesView.addFilter((entity) =>
      entity[URI.inNS(GEO, "lat")] !== undefined && entity[URI.inNS(GEO, "long")] !== undefined,
    );
    nodesView.addMapping(URI.inNS(GEO, "lat"), "latitude");
    nodesView.addMapping(URI.inNS(GEO, "long"), "longitude");
    return nodesView;
  }

  private getWaysView() {
    const waysView = new IndexThingView(RoutableTileWay.create);
    waysView.addFilter((entity) =>
      entity[URI.inNS(RDF, "type")] === URI.inNS(OSM, "Way"),
    );
    waysView.addMapping(URI.inNS(OSM, "nodes"), "segments"); // todo mapping to segments
    waysView.addMapping(URI.inNS(RDFS, "label"), "label");
    return waysView;
  }

  private long2tile(lon: number, zoom: number) {
    return (Math.floor((lon + 180) / 360 * Math.pow(2, zoom)));
  }

  private lat2tile(lat: number, zoom: number) {
    return (Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1
      / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)));
  }
}
