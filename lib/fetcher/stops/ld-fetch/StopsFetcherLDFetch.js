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
const types_1 = __importDefault(require("../../../types"));
const Rdf_1 = __importDefault(require("../../../util/Rdf"));
let StopsFetcherLDFetch = class StopsFetcherLDFetch {
    constructor(ldFetch) {
        this.ldFetch = ldFetch;
        // FIXME does this ever do something?
        this.loadStops();
    }
    addStopSource(source) {
        throw new Error("Method not implemented.");
    }
    getSources() {
        return [{ accessUrl: this.accessUrl }];
    }
    setAccessUrl(accessUrl) {
        this.accessUrl = accessUrl;
    }
    prefetchStops() {
        this.ensureStopsLoaded();
    }
    async getStopById(stopId) {
        await this.ensureStopsLoaded();
        return this.stops[stopId];
    }
    async getAllStops() {
        await this.ensureStopsLoaded();
        return Object.values(this.stops);
    }
    async ensureStopsLoaded() {
        if (!this.loadPromise && !this.stops) {
            this.loadStops();
        }
        if (this.loadPromise) {
            await this.loadPromise;
        }
    }
    loadStops() {
        if (this.accessUrl) {
            this.loadPromise = this.ldFetch
                .get(this.accessUrl)
                .then((response) => {
                this.stops = this.parseTriples(response.triples);
                this.loadPromise = null;
            })
                .catch((reason) => {
                console.log(reason);
            });
        }
    }
    transformPredicate(triple) {
        return Rdf_1.default.transformPredicate({
            "http://xmlns.com/foaf/0.1/name": "name",
            "http://schema.org/name": "name",
            "http://www.w3.org/2003/01/geo/wgs84_pos#lat": "latitude",
            "http://www.w3.org/2003/01/geo/wgs84_pos#long": "longitude",
        }, triple);
    }
    parseTriples(triples) {
        return triples.reduce((stopMap, triple) => {
            triple = this.transformPredicate(triple);
            const { subject: { value: subject }, predicate: { value: predicate }, object: { value: object } } = triple;
            if (!(subject in stopMap)) {
                stopMap[subject] = {
                    id: subject,
                };
            }
            if (predicate === "longitude" || predicate === "latitude") {
                stopMap[subject][predicate] = parseFloat(object);
            }
            else {
                stopMap[subject][predicate] = object;
            }
            return stopMap;
        }, {});
    }
};
StopsFetcherLDFetch = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(types_1.default.LDFetch)),
    __metadata("design:paramtypes", [typeof (_a = typeof ldfetch_1.default !== "undefined" && ldfetch_1.default) === "function" ? _a : Object])
], StopsFetcherLDFetch);
exports.default = StopsFetcherLDFetch;
//# sourceMappingURL=StopsFetcherLDFetch.js.map