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
Object.defineProperty(exports, "__esModule", { value: true });
const inversify_1 = require("inversify");
const types_1 = __importDefault(require("../../types"));
let StopsProviderDefault = class StopsProviderDefault {
    constructor(stopsFetcherFactory) {
        this.sources = [];
        this.stopsFetchers = [];
        this.cachedStops = [];
        this.stopsFetcherFactory = stopsFetcherFactory;
    }
    addStopSource(source) {
        this.sources.push(source);
        this.cachedStops = [];
        this.allStops = null;
        this.stopsFetchers.push(this.stopsFetcherFactory(source.accessUrl));
    }
    getSources() {
        return this.sources;
    }
    prefetchStops() {
        for (const stopsFetcher of this.stopsFetchers) {
            stopsFetcher.prefetchStops();
        }
    }
    async getStopById(stopId) {
        return Promise.all(this.stopsFetchers
            .map((stopsFetcher) => stopsFetcher.getStopById(stopId))).then((results) => results.find((stop) => stop !== undefined));
    }
    async getAllStops() {
        if (!this.allStops) {
            if (this.cachedStops.length > 0) {
                return Promise.resolve(this.cachedStops);
            }
            this.allStops = Promise.all(this.stopsFetchers
                .map((stopsFetcher) => stopsFetcher.getAllStops())).then((results) => {
                this.cachedStops = [].concat(...results);
                return this.cachedStops;
            });
        }
        return this.allStops;
    }
};
StopsProviderDefault = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(types_1.default.StopsFetcherFactory)),
    __metadata("design:paramtypes", [Function])
], StopsProviderDefault);
exports.default = StopsProviderDefault;
//# sourceMappingURL=StopsProviderDefault.js.map