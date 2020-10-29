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
const Geo_1 = __importDefault(require("../../util/Geo"));
const ReachableStopsFinderRoadPlanner_1 = __importDefault(require("./ReachableStopsFinderRoadPlanner"));
/**
 * This [[IReachableStopsFinder]] forms a caching layer in front of a [[ReachableStopsFinderRoadPlanner]] instance,
 * so all the queries don't have to be executed repeatedly
 */
let ReachableStopsFinderRoadPlannerCached = class ReachableStopsFinderRoadPlannerCached {
    constructor(stopsProvider, roadPlanner) {
        this.reachableStopsFinder = new ReachableStopsFinderRoadPlanner_1.default(stopsProvider, roadPlanner);
        this.reachableStopsCache = {};
    }
    async findReachableStops(location, mode, maximumDuration, minimumSpeed, profileID) {
        const id = location.id || Geo_1.default.getId(location);
        const cacheKey = `${id} ${mode} ${maximumDuration} ${minimumSpeed}`;
        const cacheItem = this.reachableStopsCache[cacheKey];
        if (cacheItem) {
            return cacheItem;
        }
        const reachableStops = await this.reachableStopsFinder
            .findReachableStops(location, mode, maximumDuration, minimumSpeed, profileID);
        this.reachableStopsCache[cacheKey] = reachableStops;
        return reachableStops;
    }
};
ReachableStopsFinderRoadPlannerCached = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(types_1.default.StopsProvider)),
    __param(1, inversify_1.inject(types_1.default.RoadPlanner)),
    __metadata("design:paramtypes", [Object, Object])
], ReachableStopsFinderRoadPlannerCached);
exports.default = ReachableStopsFinderRoadPlannerCached;
//# sourceMappingURL=ReachableStopsFinderRoadPlannerCached.js.map