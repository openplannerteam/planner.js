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
const inversify_1 = require("inversify");
const __1 = require("../..");
const footpath_1 = require("../../entities/footpaths/footpath");
const TileCoordinate_1 = __importDefault(require("../../entities/tiles/TileCoordinate"));
const EventBus_1 = __importDefault(require("../../events/EventBus"));
const EventType_1 = __importDefault(require("../../events/EventType"));
const Tiles_1 = require("../../util/Tiles");
const ZOOM = 12;
let FootpathsProviderRaw = class FootpathsProviderRaw {
    constructor() {
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
        const beginTime = new Date();
        const response = await fetch(url);
        const size = this.parseResponseLength(response);
        const duration = (new Date()).getTime() - beginTime.getTime();
        const responseText = await response.text();
        const footpaths = {};
        if (response.status !== 200) {
            EventBus_1.default.getInstance().emit(EventType_1.default.Warning, `${url} responded with status code ${response.status}`);
        }
        if (response.status === 200 && responseText) {
            const blob = JSON.parse(responseText);
            for (const entity of blob["@graph"]) {
                const id = entity["@id"];
                const footpath = new footpath_1.Footpath(id);
                footpath.to = entity["planner:destination"];
                footpath.from = entity["planner:source"];
                footpath.distance = entity["planner:distance"];
                footpaths[id] = footpath;
            }
        }
        EventBus_1.default.getInstance().emit(EventType_1.default.ResourceFetch, {
            datatype: __1.DataType.Footpath,
            url,
            duration,
            size,
        });
        return footpaths;
    }
    parseResponseLength(response) {
        if (response.headers.get("content-length")) {
            return parseInt(response.headers.get("content-length"), 10);
        }
        else {
            try {
                return response.body._chunkSize;
            }
            catch (e) {
                //
            }
        }
    }
};
FootpathsProviderRaw = __decorate([
    inversify_1.injectable(),
    __metadata("design:paramtypes", [])
], FootpathsProviderRaw);
exports.default = FootpathsProviderRaw;
//# sourceMappingURL=FootpathsProviderRaw.js.map