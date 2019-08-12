import { inject, injectable } from "inversify";
import { IRoutableTileNodeIndex, RoutableTileNode } from "../../entities/tiles/node";
import RoutableTileRegistry from "../../entities/tiles/registry";
import { RoutableTile } from "../../entities/tiles/tile";
import { IRoutableTileWayIndex, RoutableTileWay } from "../../entities/tiles/way";
import PathfinderProvider from "../../pathfinding/PathfinderProvider";
import TYPES from "../../types";
import { OSM } from "../../uri/constants";
import URI from "../../uri/uri";
import IRoutableTileFetcher from "./IRoutableTileFetcher";

@injectable()
export default class RoutableTileFetcherRaw implements IRoutableTileFetcher {

  protected mapping: object;
  protected pathfinderProvider: PathfinderProvider;
  protected routableTileRegistry: RoutableTileRegistry;

  constructor(
    @inject(TYPES.PathfinderProvider) pathfinderProvider: PathfinderProvider,
    @inject(TYPES.RoutableTileRegistry) routableTileRegistry: RoutableTileRegistry,
  ) {
    this.pathfinderProvider = pathfinderProvider;
    this.routableTileRegistry = routableTileRegistry;
    this.mapping = {};

    this.mapping["osm:barrier"] = "barrierKind";
    this.mapping["osm:access"] = "accessRestrictions";
    this.mapping["osm:bicycle"] = "bicycleAccessRestrictions";
    this.mapping["osm:construction"] = "constructionKind";
    this.mapping["osm:crossing"] = "crossingKind";
    this.mapping["osm:cycleway"] = "cyclewayKind";
    this.mapping["osm:footway"] = "footwayKind";
    this.mapping["osm:highway"] = "highwayKind";
    this.mapping["osm:maxspeed"] = "maxSpeed";
    this.mapping["osm:motor_vehicle"] = "motorVehicleAccessRestrictions";
    this.mapping["osm:motorcar"] = "motorcarAccessRestrictions";
    this.mapping["osm:oneway_bicycle"] = "onewayBicycleKind";
    this.mapping["osm:oneway"] = "onewayKind";
    this.mapping["osm:smoothness"] = "smoothnessKind";
    this.mapping["osm:surface"] = "surfaceKind";
    this.mapping["osm:tracktype"] = "trackType";
    this.mapping["osm:vehicle"] = "vehicleAccessRestrictions";
  }

  public async get(url: string): Promise<RoutableTile> {
    const response = await fetch(url);
    const responseText = await response.text();
    const blob = JSON.parse(responseText);

    const nodes: IRoutableTileNodeIndex = {};
    const ways: IRoutableTileWayIndex = {};

    for (const entity of blob["@graph"]) {
      if (entity["@type"] === "osm:Node") {
        const node = this.createNode(entity);
        nodes[node.id] = node;
      } else if (entity["@type"] === "osm:Way") {
        const way = this.createWay(entity);
        ways[way.id] = way;
      }
    }

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

  private createNode(blob): RoutableTileNode {
    const id = blob["@id"];
    const node = new RoutableTileNode(id);
    node.latitude = parseFloat(blob["geo:lat"]);
    node.longitude = parseFloat(blob["geo:long"]);

    for (const [tag, field] of Object.entries(this.mapping)) {
      if (blob[tag] && !node[field]) {
        node[field] = URI.fakeExpand(OSM, blob[tag]);
      }
    }

    return node;
  }

  private createWay(blob): RoutableTileWay {
    const id = blob["@id"];
    const way = new RoutableTileWay(id);
    if (blob["osm:maxspeed"]) {
      way.maxSpeed = parseFloat(blob["osm:maxspeed"]);
    }
    if (blob["osm:hasNodes"]) {
      way.segments = [blob["osm:hasNodes"]];
    } else {
      const weights = blob["osm:hasEdges"];
      way.segments = [weights["osm:hasNodes"]];
      way.weights = [weights["osm:hasWeights"]];
    }

    way.name = blob["osm:name"];

    for (const [tag, field] of Object.entries(this.mapping)) {
      if (blob[tag] && !way[field]) {
        way[field] = URI.fakeExpand(OSM, blob[tag]);
      }
    }

    return way;
  }
}
