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
const __1 = require("../..");
const RoutableTile_1 = require("../../entities/tiles/RoutableTile");
const RoutableTileNode_1 = require("../../entities/tiles/RoutableTileNode");
const RoutableTileRegistry_1 = __importDefault(require("../../entities/tiles/RoutableTileRegistry"));
const RoutableTileWay_1 = require("../../entities/tiles/RoutableTileWay");
const EventBus_1 = __importDefault(require("../../events/EventBus"));
const EventType_1 = __importDefault(require("../../events/EventType"));
const constants_1 = require("../../uri/constants");
const uri_1 = __importDefault(require("../../uri/uri"));
let RoutableTileFetcherRaw = class RoutableTileFetcherRaw {
    constructor() {
        this.routableTileRegistry = RoutableTileRegistry_1.default.getInstance();
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
            const nodes = {};
            const ways = {};
            const size = this.parseResponseLength(response);
            const duration = (new Date()).getTime() - beginTime.getTime();
            for (const entity of blob["@graph"]) {
                if (entity["@type"] === "osm:Node") {
                    const node = this.createNode(entity);
                    nodes[node.id] = node;
                }
                else if (entity["@type"] === "osm:Way") {
                    const way = this.createWay(entity);
                    ways[way.id] = way;
                }
            }
            EventBus_1.default.getInstance().emit(EventType_1.default.ResourceFetch, {
                DataType: __1.DataType.RoutableTile,
                url,
                duration,
                size,
            });
            return this.processTileData(url, nodes, ways);
        }
        else {
            return new RoutableTile_1.RoutableTile(url, new Set(), new Set());
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
    processTileData(url, nodes, ways) {
        for (const node of Object.values(nodes)) {
            this.routableTileRegistry.registerNode(node);
        }
        for (const way of Object.values(ways)) {
            this.routableTileRegistry.registerWay(way);
        }
        return new RoutableTile_1.RoutableTile(url, new Set(Object.keys(nodes)), new Set(Object.keys(ways)));
    }
    createNode(blob) {
        const id = blob["@id"];
        const node = new RoutableTileNode_1.RoutableTileNode(id);
        node.latitude = parseFloat(blob["geo:lat"]);
        node.longitude = parseFloat(blob["geo:long"]);
        for (const [key, value] of Object.entries(blob)) {
            if (key === "osm:hasTag") {
                node.freeformTags = value;
            }
            else if (key.indexOf("osm:") === 0) {
                const expandedKey = uri_1.default.fakeExpand(constants_1.OSM, key);
                if (value.toString().indexOf("osm:") === 0) {
                    const expandedValue = uri_1.default.fakeExpand(constants_1.OSM, value.toString());
                    node.definedTags[expandedKey] = expandedValue;
                }
                else {
                    node.definedTags[expandedKey] = value;
                }
            }
        }
        return node;
    }
    createWay(blob) {
        const id = blob["@id"];
        const way = new RoutableTileWay_1.RoutableTileWay(id);
        if (blob["osm:maxspeed"]) {
            way.maxSpeed = parseFloat(blob["osm:maxspeed"]);
        }
        if (blob["osm:hasNodes"]) {
            way.segments = [blob["osm:hasNodes"]];
        }
        else {
            const weights = blob["osm:hasEdges"];
            way.segments = [weights["osm:hasNodes"]];
            way.distances = [weights["osm:hasWeights"]];
        }
        way.name = blob["osm:name"];
        for (const [key, value] of Object.entries(blob)) {
            if (key === "osm:hasNodes" || key === "osm:hasWeights") {
                // not tags, these are our own properties
                continue;
            }
            else if (key === "osm:hasTag") {
                way.freeformTags = value;
            }
            else if (key.indexOf("osm:") === 0) {
                const expandedKey = uri_1.default.fakeExpand(constants_1.OSM, key);
                if (value.toString().indexOf("osm:") === 0) {
                    const expandedValue = uri_1.default.fakeExpand(constants_1.OSM, value.toString());
                    way.definedTags[expandedKey] = expandedValue;
                }
                else {
                    way.definedTags[expandedKey] = value;
                }
            }
        }
        return way;
    }
};
RoutableTileFetcherRaw = __decorate([
    inversify_1.injectable(),
    __metadata("design:paramtypes", [])
], RoutableTileFetcherRaw);
exports.default = RoutableTileFetcherRaw;
//# sourceMappingURL=RoutableTileFetcherRaw.js.map