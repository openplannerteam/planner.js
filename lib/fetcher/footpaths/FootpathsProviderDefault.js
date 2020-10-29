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
const footpath_1 = require("../../entities/footpaths/footpath");
const TileCoordinate_1 = __importDefault(require("../../entities/tiles/TileCoordinate"));
const ldloader_1 = require("../../loader/ldloader");
const views_1 = require("../../loader/views");
const types_1 = __importDefault(require("../../types"));
const constants_1 = require("../../uri/constants");
const uri_1 = __importDefault(require("../../uri/uri"));
const Tiles_1 = require("../../util/Tiles");
const ZOOM = 12;
let FootpathsProviderDefault = class FootpathsProviderDefault {
    constructor(ldFetch) {
        this.ldFetch = ldFetch;
        this.ldLoader = new ldloader_1.LDLoader();
        this.paths = {};
    }
    async get(stop) {
        const tileId = this.getIdForLocation(ZOOM, stop);
        if (!this.paths[tileId]) {
            this.paths[tileId] = this.getByUrl(tileId);
        }
        return this.paths[tileId];
    }
    getIdForLocation(zoom, location) {
        const y = Tiles_1.lat_to_tile(location.latitude, zoom);
        const x = Tiles_1.long_to_tile(location.longitude, zoom);
        const coordinate = new TileCoordinate_1.default(zoom, x, y);
        return this.getIdForTileCoords(coordinate);
    }
    getIdForTileCoords(coordinate) {
        return `https://hdelva.be/stops/distances/${coordinate.zoom}/${coordinate.x}/${coordinate.y}`;
    }
    getByLocation(zoom, location) {
        const y = Tiles_1.lat_to_tile(location.latitude, zoom);
        const x = Tiles_1.long_to_tile(location.longitude, zoom);
        const coordinate = new TileCoordinate_1.default(zoom, x, y);
        return this.getByTileCoords(coordinate);
    }
    async getByTileCoords(coordinate) {
        const url = this.getIdForTileCoords(coordinate);
        return await this.getByUrl(url);
    }
    async getByUrl(url) {
        const rdfThing = await this.ldFetch.get(url);
        const triples = rdfThing.triples;
        const [paths] = this.ldLoader.process(triples, [
            this.getPathsView(),
        ]);
        return paths;
    }
    getPathsView() {
        const nodesView = new views_1.IndexThingView(footpath_1.Footpath.create);
        nodesView.addMapping(uri_1.default.inNS(constants_1.PLANNER, "source"), "from");
        nodesView.addMapping(uri_1.default.inNS(constants_1.PLANNER, "destination"), "to");
        nodesView.addMapping(uri_1.default.inNS(constants_1.PLANNER, "distance"), "distance");
        return nodesView;
    }
};
FootpathsProviderDefault = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(types_1.default.LDFetch)),
    __metadata("design:paramtypes", [typeof (_a = typeof ldfetch_1.default !== "undefined" && ldfetch_1.default) === "function" ? _a : Object])
], FootpathsProviderDefault);
exports.default = FootpathsProviderDefault;
//# sourceMappingURL=FootpathsProviderDefault.js.map