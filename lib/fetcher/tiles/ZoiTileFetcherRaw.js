"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cross_fetch_1 = __importDefault(require("cross-fetch"));
const inversify_1 = require("inversify");
const parse = require("wellknown");
const __1 = require("../..");
const ZoiSubject_1 = __importDefault(require("../../entities/tiles/ZoiSubject"));
const ZoiTile_1 = require("../../entities/tiles/ZoiTile");
const ZoiZone_1 = require("../../entities/tiles/ZoiZone");
const geometry_1 = __importDefault(require("../../entities/tree/geometry"));
const EventBus_1 = __importDefault(require("../../events/EventBus"));
const EventType_1 = __importDefault(require("../../events/EventType"));
const JSONLDContext_1 = __importDefault(require("../../uri/JSONLDContext"));
function parseWktLiteral(raw) {
    const [reference, ...rest] = raw.split(" ");
    if (reference === "<http://www.opengis.net/def/crs/OGC/1.3/CRS84>") {
        return parse(rest.join(" "));
    }
    return parse(raw);
}
let ZoiTileFetcherRaw = class ZoiTileFetcherRaw {
    constructor() {
        this.eventBus = EventBus_1.default.getInstance();
    }
    async get(url) {
        const beginTime = new Date();
        const response = await cross_fetch_1.default(url);
        const responseText = await response.text();
        if (response.status !== 200) {
            EventBus_1.default.getInstance().emit(EventType_1.default.Warning, `${url} responded with status code ${response.status}`);
        }
        if (response.status === 200 && responseText) {
            const blob = JSON.parse(responseText);
            const subjects = {};
            const properties = {};
            const zones = [];
            const size = this.parseResponseLength(response);
            const duration = (new Date()).getTime() - beginTime.getTime();
            const context = new JSONLDContext_1.default(blob["@context"]);
            for (const entity of blob["@graph"]) {
                if (entity["@type"] === "owl:Restriction") {
                    const subject = this.createSubject(entity, context);
                    subjects[subject.id] = subject;
                }
                else if (entity["rdfs:subPropertyOf"] === "dct:subject") {
                    const [property, degree] = this.createProperty(entity);
                    properties[property] = degree;
                }
                else if (entity["geo:asWKT"]) {
                    const zone = this.createZone(entity, subjects, properties);
                    this.eventBus.emit(EventType_1.default.ZoiZone, zone);
                    zones.push(zone);
                }
            }
            EventBus_1.default.getInstance().emit(EventType_1.default.ResourceFetch, {
                DataType: __1.DataType.ZoiTile,
                url,
                duration,
                size,
            });
            return new ZoiTile_1.ZoiTile(url, zones);
        }
        else {
            return new ZoiTile_1.ZoiTile(url, []);
        }
    }
    parseResponseLength(response) {
        if (response.headers.get("content-length")) {
            return parseInt(response.headers.get("content-length"), 10);
        }
        else {
            try {
                return response.body._outOffset;
            }
            catch (e) {
                //
            }
        }
    }
    createSubject(blob, context) {
        const id = blob["@id"];
        const property = blob["owl:onProperty"];
        const values = blob["owl:someValuesFrom"].map((v) => context.resolveIdentifier(v));
        const subject = new ZoiSubject_1.default(id, property, values);
        return subject;
    }
    createProperty(blob) {
        const id = blob["@id"];
        const degree = blob["truth:degree"];
        return [id, degree];
    }
    createZone(blob, subjects, properties) {
        const id = blob["@id"];
        const area = new geometry_1.default(null);
        area.area = parseWktLiteral(blob["geo:asWKT"]);
        for (const [property, value] of Object.entries(blob)) {
            if (properties[property]) {
                const degree = properties[property];
                const subject = subjects[value];
                return new ZoiZone_1.ZoiZone(id, area, subject, degree);
            }
        }
    }
};
ZoiTileFetcherRaw = __decorate([
    inversify_1.injectable(),
    __metadata("design:paramtypes", [])
], ZoiTileFetcherRaw);
exports.default = ZoiTileFetcherRaw;
//# sourceMappingURL=ZoiTileFetcherRaw.js.map