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
const __1 = require("../..");
const EventBus_1 = __importDefault(require("../../events/EventBus"));
const types_1 = __importDefault(require("../../types"));
let StopsFetcherRaw = 
// tslint:disable: no-string-literal
class StopsFetcherRaw {
    constructor(ldFetch) {
        this.ldFetch = ldFetch;
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
        this.loadPromise = this.getByUrl(this.accessUrl)
            .then((stops) => {
            this.stops = stops;
            this.loadPromise = null;
        })
            .catch((reason) => {
            console.log(reason);
        });
    }
    async getByUrl(url) {
        const beginTime = new Date();
        const response = await fetch(url);
        const responseText = await response.text();
        const size = this.parseResponseLength(response);
        const duration = (new Date()).getTime() - beginTime.getTime();
        const stops = {};
        if (response.status !== 200) {
            EventBus_1.default.getInstance().emit(__1.EventType.Warning, `${url} responded with status code ${response.status}`);
        }
        if (response.status === 200 && responseText) {
            const blob = JSON.parse(responseText);
            for (const entity of blob["@graph"]) {
                const id = entity["@id"];
                const latitudeRaw = entity["http://www.w3.org/2003/01/geo/wgs84_pos#lat"] || entity["latitude"];
                const longitudeRaw = entity["http://www.w3.org/2003/01/geo/wgs84_pos#long"] || entity["longitude"];
                const stopTimeRaw = entity["avgStopTimes"] || 0;
                const stop = {
                    id: entity["@id"],
                    latitude: parseFloat(latitudeRaw),
                    longitude: parseFloat(longitudeRaw),
                    name: entity["name"],
                    avgStopTimes: parseFloat(stopTimeRaw) * 1000,
                };
                stops[id] = stop;
            }
        }
        EventBus_1.default.getInstance().emit(__1.EventType.ResourceFetch, {
            DataType: __1.DataType.Stops,
            url,
            duration,
            size,
        });
        return stops;
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
StopsFetcherRaw = __decorate([
    inversify_1.injectable()
    // tslint:disable: no-string-literal
    ,
    __param(0, inversify_1.inject(types_1.default.LDFetch)),
    __metadata("design:paramtypes", [typeof (_a = typeof ldfetch_1.default !== "undefined" && ldfetch_1.default) === "function" ? _a : Object])
], StopsFetcherRaw);
exports.default = StopsFetcherRaw;
//# sourceMappingURL=StopsFetcherRaw.js.map