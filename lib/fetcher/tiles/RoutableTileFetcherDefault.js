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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const inversify_1 = require("inversify");
const ldfetch_1 = __importDefault(require("ldfetch"));
const node_1 = require("../../entities/tiles/node");
const registry_1 = __importDefault(require("../../entities/tiles/registry"));
const tile_1 = require("../../entities/tiles/tile");
const way_1 = require("../../entities/tiles/way");
const OSMTags_1 = __importDefault(require("../../enums/OSMTags"));
const ldloader_1 = require("../../loader/ldloader");
const views_1 = require("../../loader/views");
const PathfinderProvider_1 = __importDefault(require("../../pathfinding/PathfinderProvider"));
const types_1 = __importDefault(require("../../types"));
const constants_1 = require("../../uri/constants");
const uri_1 = __importDefault(require("../../uri/uri"));
let RoutableTileFetcherDefault = class RoutableTileFetcherDefault {
    constructor(ldFetch, pathfinderProvider) {
        this.ldFetch = ldFetch;
        this.ldLoader = new ldloader_1.LDLoader();
        this.ldLoader.defineCollection(uri_1.default.inNS(constants_1.OSM, "hasNodes")); // unordered collection
        this.pathfinderProvider = pathfinderProvider;
        this.routableTileRegistry = registry_1.default.getInstance();
    }
    async get(url) {
        const rdfThing = await this.ldFetch.get(url);
        const triples = rdfThing.triples;
        let nodes;
        let ways;
        [nodes, ways] = this.ldLoader.process(triples, [
            this.getNodesView(),
            this.getWaysView(),
        ]);
        return this.processTileData(url, nodes, ways);
    }
    processTileData(url, nodes, ways) {
        this.pathfinderProvider.registerEdges(ways, nodes);
        for (const node of Object.values(nodes)) {
            this.routableTileRegistry.registerNode(node);
        }
        for (const way of Object.values(ways)) {
            this.routableTileRegistry.registerWay(way);
        }
        return new tile_1.RoutableTile(url, new Set(Object.keys(nodes)), new Set(Object.keys(ways)));
    }
    getNodesView() {
        const nodesView = new views_1.IndexThingView(node_1.RoutableTileNode.create);
        nodesView.addFilter((entity) => entity[uri_1.default.inNS(constants_1.GEO, "lat")] !== undefined && entity[uri_1.default.inNS(constants_1.GEO, "long")] !== undefined);
        nodesView.addMapping(uri_1.default.inNS(constants_1.GEO, "lat"), "latitude");
        nodesView.addMapping(uri_1.default.inNS(constants_1.GEO, "long"), "longitude");
        for (const [tag, field] of Object.entries(OSMTags_1.default())) {
            nodesView.addMapping(tag, field);
        }
        return nodesView;
    }
    getWaysView() {
        const waysView = new views_1.IndexThingView(way_1.RoutableTileWay.create);
        waysView.addFilter((entity) => entity[uri_1.default.inNS(constants_1.RDF, "type")] === uri_1.default.inNS(constants_1.OSM, "Way"));
        waysView.addMapping(uri_1.default.inNS(constants_1.OSM, "hasNodes"), "segments");
        waysView.addMapping(uri_1.default.inNS(constants_1.OSM, "name"), "name");
        for (const [tag, field] of Object.entries(OSMTags_1.default())) {
            waysView.addMapping(tag, field);
        }
        return waysView;
    }
};
RoutableTileFetcherDefault = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(types_1.default.LDFetch)),
    __param(1, inversify_1.inject(types_1.default.PathfinderProvider)),
    __metadata("design:paramtypes", [typeof (_a = typeof ldfetch_1.default !== "undefined" && ldfetch_1.default) === "function" ? _a : Object, PathfinderProvider_1.default])
], RoutableTileFetcherDefault);
exports.default = RoutableTileFetcherDefault;
//# sourceMappingURL=RoutableTileFetcherDefault.js.map