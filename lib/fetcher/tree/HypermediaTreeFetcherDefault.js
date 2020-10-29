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
const ldloader_1 = require("../../loader/ldloader");
const single_1 = require("../../loader/views/single");
const types_1 = __importDefault(require("../../types"));
const constants_1 = require("../../uri/constants");
const uri_1 = __importDefault(require("../../uri/uri"));
const geometry_1 = __importDefault(require("../../entities/tree/geometry"));
const relation_1 = __importDefault(require("../../entities/tree/relation"));
const tree_1 = __importDefault(require("../../entities/tree/tree"));
let HypermediaTreeFetcherDefault = class HypermediaTreeFetcherDefault {
    constructor(ldFetch) {
        this.ldFetch = ldFetch;
        this.ldLoader = new ldloader_1.LDLoader();
        this.ldLoader.defineCollection(uri_1.default.inNS(constants_1.TREE, "relation"));
    }
    async get(url) {
        const rdfThing = await this.ldFetch.get(url);
        const triples = rdfThing.triples;
        const [fragment] = this.ldLoader.process(triples, [
            this.getView(),
        ]);
        fragment.id = url;
        return fragment;
    }
    getView() {
        const view = new single_1.ThingView(tree_1.default.create);
        view.addFilter((entity) => {
            return entity[uri_1.default.inNS(constants_1.TREE, "relation")] !== undefined;
        });
        view.addMapping(uri_1.default.inNS(constants_1.TREE, "relation"), "relations", this.getRelationView());
        return view;
    }
    getRelationView() {
        const view = new single_1.ThingView(relation_1.default.create);
        view.addFilter((entity) => {
            return entity[uri_1.default.inNS(constants_1.RDF, "type")] === uri_1.default.inNS(constants_1.TREE, "GeospatiallyContainsRelation");
        });
        view.addMapping(uri_1.default.inNS(constants_1.TREE, "node"), "node");
        view.addMapping(uri_1.default.inNS(constants_1.TREE, "value"), "geoValue", this.getFragmentView());
        return view;
    }
    getFragmentView() {
        const view = new single_1.ThingView(geometry_1.default.create);
        view.addFilter((entity) => {
            return entity[uri_1.default.inNS(constants_1.RDF, "type")] === uri_1.default.inNS(constants_1.GEOSPARQL, "Geometry");
        });
        view.addMapping(uri_1.default.inNS(constants_1.GEOSPARQL, "asWKT"), "area");
        return view;
    }
};
HypermediaTreeFetcherDefault = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(types_1.default.LDFetch)),
    __metadata("design:paramtypes", [typeof (_a = typeof ldfetch_1.default !== "undefined" && ldfetch_1.default) === "function" ? _a : Object])
], HypermediaTreeFetcherDefault);
exports.default = HypermediaTreeFetcherDefault;
//# sourceMappingURL=HypermediaTreeFetcherDefault.js.map