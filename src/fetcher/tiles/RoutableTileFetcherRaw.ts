import fetch from "cross-fetch";
import { inject, injectable } from "inversify";
import { DataType } from "../..";
import { IRoutableTileNodeIndex, RoutableTileNode } from "../../entities/tiles/node";
import RoutableTileRegistry from "../../entities/tiles/registry";
import { RoutableTile } from "../../entities/tiles/tile";
import { IRoutableTileWayIndex, RoutableTileWay } from "../../entities/tiles/way";
import EventBus from "../../events/EventBus";
import EventType from "../../events/EventType";
import PathfinderProvider from "../../pathfinding/PathfinderProvider";
import TYPES from "../../types";
import { OSM } from "../../uri/constants";
import URI from "../../uri/uri";
import IRoutableTileFetcher from "./IRoutableTileFetcher";
import HypermediaTreeRelation from "../../entities/tree/relation";
import { RelationTypes } from "../../entities/tree/relation";
import GeometryValue from "../../entities/tree/geometry";
import parse = require("wellknown");
import { RoutableTileCoordinate } from "../../entities/tiles/coordinate";

@injectable()
export default class RoutableTileFetcherRaw implements IRoutableTileFetcher {

  protected mapping: object;
  protected pathfinderProvider: PathfinderProvider;
  protected routableTileRegistry: RoutableTileRegistry;

  constructor(
    @inject(TYPES.PathfinderProvider) pathfinderProvider: PathfinderProvider,
  ) {
    this.pathfinderProvider = pathfinderProvider;
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
      let coordinate: RoutableTileCoordinate;
      let area: GeometryValue;

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
      area = new GeometryValue();
      coordinate = new RoutableTileCoordinate(blob["tiles:zoom"], blob["tiles:longitudeTile"], blob["tiles:latitudeTile"]);

      return this.processTileData(url, nodes, ways, area, coordinate);
    } else {
      return new RoutableTile(url, new Set(), new Set());
    }
  }

  public async getMetaData(url: string): Promise<RoutableTile> {
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
      let relations = new Set<HypermediaTreeRelation>();
      let area: GeometryValue;
      let coordinate: RoutableTileCoordinate;

      const size = this.parseResponseLength(response);
      const duration = (new Date()).getTime() - beginTime.getTime();

      if (blob["tree:relation"]) {
        for (const entity of blob["tree:relation"]) {
          const relation = this.createRelation(entity);
          relations.add(relation);
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

      area = new GeometryValue();

      if (blob["tiles:GeospatiallyContains"]) {
        area.area = this.parseWktLiteralPolygon(blob["tiles:GeospatiallyContains"])
      }

      coordinate = new RoutableTileCoordinate(blob["tiles:zoom"], blob["tiles:longitudeTile"], blob["tiles:latitudeTile"]);

      return this.processTileData(url, nodes, ways, area, coordinate, relations);
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

  protected processTileData(url: string, nodes: IRoutableTileNodeIndex, ways: IRoutableTileWayIndex, area?: GeometryValue, coordinate?: RoutableTileCoordinate, relations?: Set<HypermediaTreeRelation>) {
    this.pathfinderProvider.registerEdges(ways, nodes);

    for (const node of Object.values(nodes)) {
      this.routableTileRegistry.registerNode(node);
    }

    for (const way of Object.values(ways)) {
      this.routableTileRegistry.registerWay(way);
    }

    return new RoutableTile(url, new Set(Object.keys(nodes)), new Set(Object.keys(ways)), area, coordinate, relations);
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

  private createRelation(blob): HypermediaTreeRelation {
    //what to use for id? tree:node points at the node on which this relation applies (as in this node contains that polygon)
    const id = blob["tree:node"];
    const relation = HypermediaTreeRelation.create(id);

    //this if structure looks stupid but did it to put a RelationType value into relation.type instead of assigning the string to it
    //maybe relation.type = blob["type"] would be better
    if (blob["@type"] === RelationTypes.GEOSPATIALLY_CONTAINS) {
      relation.type = RelationTypes.GEOSPATIALLY_CONTAINS;
    }
    relation.geoValue = GeometryValue.create(blob["tree:value"]);
    relation.geoValue.area = this.parseWktLiteralPolygon(blob["tree:value"]);
    relation.node = id;

    return relation;
  }

  private parseWktLiteralPolygon(raw: string) {
    const [reference, ...rest] = raw.split(" ");
    if (reference === "<http://www.opengis.net/def/crs/OGC/1.3/CRS84>") {
      return parse(rest.join(" "));
    }
    return parse(raw);
  }
}
