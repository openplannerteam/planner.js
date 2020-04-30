import fetch from "cross-fetch";
import { inject, injectable } from "inversify";
import { DataType } from "../..";
import { RoutableTile } from "../../entities/tiles/RoutableTile";
import { IRoutableTileNodeIndex, RoutableTileNode } from "../../entities/tiles/RoutableTileNode";
import RoutableTileRegistry from "../../entities/tiles/RoutableTileRegistry";
import { IRoutableTileWayIndex, RoutableTileWay } from "../../entities/tiles/RoutableTileWay";
import EventBus from "../../events/EventBus";
import EventType from "../../events/EventType";
import { OSM } from "../../uri/constants";
import URI from "../../uri/uri";
import IRoutableTileFetcher from "./IRoutableTileFetcher";

@injectable()
export default class RoutableTileFetcherRaw implements IRoutableTileFetcher {

  protected mapping: object;
  protected routableTileRegistry: RoutableTileRegistry;

  constructor() {
    this.routableTileRegistry = RoutableTileRegistry.getInstance();
  }

  public async get(url: string): Promise<RoutableTile> {
    const beginTime = new Date();
    const response = await fetch(url);
    const responseText = await response.text();
    if (response.status !== 200) {
      EventBus.getInstance().emit(EventType.Warning, `${url} responded with status code ${response.status}`);
    }
    if (response.status === 200 && responseText) {
      const blob = JSON.parse(responseText);

      const nodes: IRoutableTileNodeIndex = {};
      const ways: IRoutableTileWayIndex = {};

      const size = this.parseResponseLength(response);
      const duration = (new Date()).getTime() - beginTime.getTime();

      for (const entity of blob["@graph"]) {
        if (entity["@type"] === "osm:Node") {
          const node = this.createNode(entity);
          nodes[node.id] = node;
        } else if (entity["@type"] === "osm:Way") {
          const way = this.createWay(entity);
          ways[way.id] = way;
        }
      }

      EventBus.getInstance().emit(
        EventType.ResourceFetch,
        {
          DataType: DataType.RoutableTile,
          url,
          duration,
          size,
        },
      );

      return this.processTileData(url, nodes, ways);
    } else {
      return new RoutableTile(url, new Set(), new Set());
    }
  }

  protected parseResponseLength(response): number {
    if (response.headers.get("content-length")) {
      return parseInt(response.headers.get("content-length"), 10);
    } else {
      try {
        return response.body._outOffset;
      } catch (e) {
        //
      }
    }
  }

  protected processTileData(url: string, nodes: IRoutableTileNodeIndex, ways: IRoutableTileWayIndex) {
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

    for (const [key, value] of Object.entries(blob)) {
      if (key === "osm:hasTag") {
        node.freeformTags = value as string[];
      } else if (key.indexOf("osm:") === 0) {
        const expandedKey = URI.fakeExpand(OSM, key);

        if (value.toString().indexOf("osm:") === 0) {
          const expandedValue = URI.fakeExpand(OSM, value.toString());
          node.definedTags[expandedKey] = expandedValue;
        } else {
          node.definedTags[expandedKey] = value;
        }
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
      way.distances = [weights["osm:hasWeights"]];
    }

    way.name = blob["osm:name"];

    for (const [key, value] of Object.entries(blob)) {
      if (key === "osm:hasNodes" || key === "osm:hasWeights") {
        // not tags, these are our own properties
        continue;
      } else if (key === "osm:hasTag") {
        way.freeformTags = value as string[];
      } else if (key.indexOf("osm:") === 0) {
        const expandedKey = URI.fakeExpand(OSM, key);

        if (value.toString().indexOf("osm:") === 0) {
          const expandedValue = URI.fakeExpand(OSM, value.toString());
          way.definedTags[expandedKey] = expandedValue;
        } else {
          way.definedTags[expandedKey] = value;
        }
      }
    }

    return way;
  }
}
