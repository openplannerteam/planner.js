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
const PathfinderProvider_1 = __importDefault(require("../../pathfinding/PathfinderProvider"));
const types_1 = __importDefault(require("../../types"));
const constants_1 = require("../../uri/constants");
const uri_1 = __importDefault(require("../../uri/uri"));
const RoutableTileFetcherDefault_1 = __importDefault(require("./RoutableTileFetcherDefault"));
let RoutableTileFetcherExtended = class RoutableTileFetcherExtended extends RoutableTileFetcherDefault_1.default {
    constructor(ldFetch, pathfinder) {
        super(ldFetch, pathfinder);
    }
    async get(url) {
        const lolJs = url.split("/");
        const tileX = lolJs[lolJs.length - 2];
        const tileY = lolJs[lolJs.length - 1];
        const otherUrl = `https://www.hdelva.be/tiles/inferred/${tileX}/${tileY}`;
        const basePromise = this.ldFetch.get(url);
        const otherPromise = this.ldFetch.get(otherUrl);
        const baseResponse = await basePromise;
        const baseTriples = baseResponse.triples;
        let otherTriples = [];
        try {
            const otherResponse = await otherPromise;
            otherTriples = otherResponse.triples;
            this.ldLoader.disambiguateBlankNodes(baseTriples, "base");
            this.ldLoader.disambiguateBlankNodes(otherTriples, "other");
        }
        catch (_a) {
            // not that important
        }
        const [nodes, ways] = this.ldLoader.process(baseTriples.concat(otherTriples), [
            this.getNodesView(),
            this.getWaysView(),
        ]);
        return this.processTileData(url, nodes, ways);
    }
    getWaysView() {
        const original = super.getWaysView();
        original.addMapping(uri_1.default.inNS(constants_1.ROUTE, "reachable"), "reachable");
        return original;
    }
};
RoutableTileFetcherExtended = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(types_1.default.LDFetch)),
    __param(1, inversify_1.inject(types_1.default.PathfinderProvider)),
    __metadata("design:paramtypes", [typeof (_a = typeof ldfetch_1.default !== "undefined" && ldfetch_1.default) === "function" ? _a : Object, PathfinderProvider_1.default])
], RoutableTileFetcherExtended);
exports.default = RoutableTileFetcherExtended;
//# sourceMappingURL=RoutableTileFetcherExtended.js.map