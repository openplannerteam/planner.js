import { injectable, inject } from "inversify";
import ITransitTileFetcher from "./ITransitTileFetcher";
import RoutableTileRegistry from "../../entities/tiles/registry";
import PathfinderProvider from "../../pathfinding/PathfinderProvider";
import TYPES from "../../types";
import { TransitTile } from "../../entities/tiles/tile";
import EventBus from "../../events/EventBus";
import EventType from "../../events/EventType";
import { IRoutableTileNodeIndex, RoutableTileNode } from "../../entities/tiles/node";
import { IRoutableTileWayIndex, RoutableTileWay } from "../../entities/tiles/way";
import { OSM } from "../../uri/constants";
import URI from "../../uri/uri";
import { DataType } from "../..";
import HypermediaTreeRelation from "../../entities/tree/relation";
import { RelationTypes } from "../../entities/tree/relation";
import GeometryValue from "../../entities/tree/geometry";
import parse = require("wellknown");
import { RoutableTileCoordinate } from "../../entities/tiles/coordinate";

@injectable()
export default class TransitTileFetcherRaw implements ITransitTileFetcher {

  protected mapping: object;
  protected pathfinderProvider: PathfinderProvider;
  protected transitTileRegistry: RoutableTileRegistry;

  constructor(
    @inject(TYPES.PathfinderProvider) pathfinderProvider: PathfinderProvider,
  ) {
    this.pathfinderProvider = pathfinderProvider;
    this.transitTileRegistry = RoutableTileRegistry.getInstance();
  }

  public async get(url: string): Promise<TransitTile> {
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

      for (const entity of blob["@graph"]) {
        if (entity["@type"] === "osm:Node") {
          const node = this.createNode(entity);
          nodes[node.id] = node;
        } else if (entity["@type"] === "osm:Way") {
          const way = this.createWay(entity);
          ways[way.id] = way;
        }
      }

      if (blob["tree:relation"]) {
        for (const entity of blob["tree:relation"]) {
          const relation = this.createRelation(entity);
          relations.add(relation);
        }
      }

      EventBus.getInstance().emit(
        EventType.ResourceFetch,
        {
          DataType: DataType.TransitTile,
          url,
          duration,
          size,
        },
      );

      area = new GeometryValue();
      if (blob["geosparql:asWKT"]) {
        area.area = this.parseWktLiteral(blob["geosparql:asWKT"])
      }

      coordinate = new RoutableTileCoordinate(blob["tiles:zoom"], blob["tiles:longitudeTile"], blob["tiles:latitudeTile"]);
      return this.processTileData(url, nodes, ways, area, coordinate, relations);
    } else {
      return new TransitTile(url, new Set(), new Set(), new GeometryValue());
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

  public async getMetaData(url: string): Promise<TransitTile> {
    const beginTime = new Date();
    const response = await fetch(url);
    const responseText = await response.text();
    if (response.status !== 200) {
      EventBus.getInstance().emit(EventType.Warning, `${url} responded with status code ${response.status}`);
    }
    if (response.status === 200 && responseText) {
      const blob = JSON.parse(responseText);

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
          DataType: DataType.TransitTile,
          url,
          duration,
          size,
        },
      );

      area = new GeometryValue();
      if (blob["geosparql:asWKT"]) {
        area.area = this.parseWktLiteral(blob["geosparql:asWKT"])
      }

      coordinate = new RoutableTileCoordinate(blob["tiles:zoom"], blob["tiles:longitudeTile"], blob["tiles:latitudeTile"]);

      return new TransitTile(url, new Set(), new Set(), area, coordinate, relations);
    } else {
      return new TransitTile(url, new Set(), new Set(), new GeometryValue());
    }
  }

  private parseWktLiteral(raw: string) {
    const [reference, ...rest] = raw.split(" ");
    if (reference === "<http://www.opengis.net/def/crs/OGC/1.3/CRS84>") {
      return parse(rest.join(" "));
    }
    return parse(raw);
  }

  private createNode(blob): RoutableTileNode {
    const id = blob["@id"];
    const node = new RoutableTileNode(id);
    node.latitude = parseFloat(blob["geo:lat"]);
    node.longitude = parseFloat(blob["geo:long"]);

    if (!node.latitude && !node.longitude) {
      const rest = this.parseWktLiteral(blob["geosparql:asWKT"]);
      node.longitude = parseFloat(rest.coordinates[0]);
      node.latitude = parseFloat(rest.coordinates[1]);
    }


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

  private createRelation(blob): HypermediaTreeRelation {
    const id = blob["tree:node"];
    const relation = HypermediaTreeRelation.create(id);

    if (blob["@type"] === RelationTypes.GEOSPATIALLY_CONTAINS) {
      relation.type = RelationTypes.GEOSPATIALLY_CONTAINS;
    }
    relation.geoValue = GeometryValue.create(blob["tree:value"]);
    relation.geoValue.area = this.parseWktLiteral(blob["tree:value"]);
    relation.node = id;

    return relation;
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

  protected processTileData(url: string, nodes: IRoutableTileNodeIndex, ways: IRoutableTileWayIndex, area: GeometryValue, coordinate: RoutableTileCoordinate, relations: Set<HypermediaTreeRelation>) {
    this.pathfinderProvider.registerEdges(ways, nodes);

    for (const node of Object.values(nodes)) {
      this.transitTileRegistry.registerNode(node);
    }

    for (const way of Object.values(ways)) {
      this.transitTileRegistry.registerWay(way);
    }

    return new TransitTile(url, new Set(Object.keys(nodes)), new Set(Object.keys(ways)), area, coordinate, relations);
  }
}
