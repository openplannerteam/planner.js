import fetch from "cross-fetch";
import { injectable } from "inversify";
import parse = require("wellknown");
import { DataType } from "../..";
import ZoiSubject from "../../entities/tiles/ZoiSubject";
import { ZoiTile } from "../../entities/tiles/ZoiTile";
import { ZoiZone } from "../../entities/tiles/ZoiZone";
import GeometryValue from "../../entities/tree/geometry";
import EventBus from "../../events/EventBus";
import EventType from "../../events/EventType";
import PathfinderProvider from "../../pathfinding/PathfinderProvider";
import JSONLDContext from "../../uri/JSONLDContext";
import IZoiTileFetcher from "./IZoiTileFetcherRaw";

import { EventEmitter } from "events";

function parseWktLiteral(raw: string) {
  const [reference, ...rest] = raw.split(" ");
  if (reference === "<http://www.opengis.net/def/crs/OGC/1.3/CRS84>") {
    return parse(rest.join(" "));
  }
  return parse(raw);
}

@injectable()
export default class ZoiTileFetcherRaw implements IZoiTileFetcher {

  protected mapping: object;
  protected pathfinderProvider: PathfinderProvider;
  protected eventBus: EventEmitter;

  public constructor() {
    this.eventBus = EventBus.getInstance();
  }

  public async get(url: string): Promise<ZoiTile> {
    const beginTime = new Date();
    const response = await fetch(url);
    const responseText = await response.text();
    if (response.status !== 200) {
      EventBus.getInstance().emit(EventType.Warning, `${url} responded with status code ${response.status}`);
    }
    if (response.status === 200 && responseText) {
      const blob = JSON.parse(responseText);

      const subjects = {};
      const properties = {};
      const zones: ZoiZone[] = [];

      const size = this.parseResponseLength(response);
      const duration = (new Date()).getTime() - beginTime.getTime();
      const context = new JSONLDContext(blob["@context"]);

      for (const entity of blob["@graph"]) {
        if (entity["@type"] === "owl:Restriction") {
          const subject = this.createSubject(entity, context);
          subjects[subject.id] = subject;
        } else if (entity["rdfs:subPropertyOf"] === "dct:subject") {
          const [property, degree] = this.createProperty(entity);
          properties[property] = degree;
        } else if (entity["geo:asWKT"]) {
          const zone = this.createZone(entity, subjects, properties);
          this.eventBus.emit(EventType.ZoiZone, zone);
          zones.push(zone);
        }
      }

      EventBus.getInstance().emit(
        EventType.ResourceFetch,
        {
          DataType: DataType.ZoiTile,
          url,
          duration,
          size,
        },
      );

      return new ZoiTile(url, zones);
    } else {
      return new ZoiTile(url, []);
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

  private createSubject(blob, context: JSONLDContext): ZoiSubject {
    const id = blob["@id"];
    const property = blob["owl:onProperty"];
    const values = blob["owl:someValuesFrom"].map((v: string) => context.resolveIdentifier(v));

    const subject = new ZoiSubject(id, property, values);
    return subject;
  }

  private createProperty(blob): [string, number] {
    const id = blob["@id"];
    const degree = blob["truth:degree"];
    return [id, degree];
  }

  private createZone(blob, subjects, properties): ZoiZone {
    const id = blob["@id"];
    const area = new GeometryValue(null);
    area.area = parseWktLiteral(blob["geo:asWKT"]);

    for (const [property, value] of Object.entries(blob)) {
      if (properties[property]) {
        const degree = properties[property];
        const subject = subjects[value as string];

        return new ZoiZone(id, area, subject, degree);
      }
    }
  }
}
