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
const d3_delaunay_1 = require("d3-delaunay");
const inversify_1 = require("inversify");
const ReachableStopsFinderMode_1 = __importDefault(require("../../enums/ReachableStopsFinderMode"));
const types_1 = __importDefault(require("../../types"));
const Iterators_1 = __importDefault(require("../../util/Iterators"));
let ReachableStopsFinderDelaunay = class ReachableStopsFinderDelaunay {
    constructor(stopsProvider, roadPlanner) {
        this.stopsProvider = stopsProvider;
        this.roadPlanner = roadPlanner;
        this.prepare();
    }
    async findReachableStops(location, mode, maximumDuration, minimumSpeed, profileID) {
        const minimumDepartureTime = new Date();
        const maximumArrivalTime = new Date(minimumDepartureTime.getTime() + maximumDuration);
        const baseProp = mode === ReachableStopsFinderMode_1.default.Target ? "to" : "from";
        const otherProp = mode === ReachableStopsFinderMode_1.default.Target ? "from" : "to";
        const baseQuery = {
            [baseProp]: [location],
            minimumDepartureTime,
            maximumArrivalTime,
            minimumWalkingSpeed: minimumSpeed,
            profileID,
        };
        const stopsNearCell = await this.getNearbyStops(location);
        const reachableStops = [];
        await Promise.all(stopsNearCell.map(async (possibleTarget) => {
            const query = Object.assign({}, baseQuery, {
                [otherProp]: [possibleTarget],
            });
            const pathIterator = await this.roadPlanner.plan(query);
            const durationIterator = pathIterator.map((path) => path.legs.reduce((totalDuration, step) => totalDuration + step.getAverageDuration(), 0));
            const durations = await Iterators_1.default.toArray(durationIterator);
            if (durations.length) {
                const shortestDuration = Math.min(...durations);
                reachableStops.push({ stop: possibleTarget, duration: shortestDuration });
            }
        }));
        return reachableStops;
    }
    async getNearbyStops(location) {
        if (!this.triangles) {
            await this.prepare();
        }
        const cell = this.triangles.find(location.longitude, location.latitude);
        const result = [this.trianglePoints[cell]];
        // not including these for now
        // may result in large route network queries if the stops network is sparse
        /*
        const neighbors = this.triangles.neighbors(cell);
        for (const neighbor of neighbors) {
          const neighborLocation = this.trianglePoints[neighbor];
          if (Geo.getDistanceBetweenLocations(location, neighborLocation) < 2500) {
            result.push(neighborLocation);
          }
        }
        */
        return result;
    }
    async prepare() {
        this.trianglePoints = await this.stopsProvider.getAllStops();
        if (this.trianglePoints && this.trianglePoints.length) {
            function getX(p) {
                return p.longitude;
            }
            function getY(p) {
                return p.latitude;
            }
            this.triangles = d3_delaunay_1.Delaunay.from(this.trianglePoints, getX, getY);
        }
    }
};
ReachableStopsFinderDelaunay = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(types_1.default.StopsProvider)),
    __param(1, inversify_1.inject(types_1.default.RoadPlanner)),
    __metadata("design:paramtypes", [Object, Object])
], ReachableStopsFinderDelaunay);
exports.default = ReachableStopsFinderDelaunay;
//# sourceMappingURL=ReachableStopsFinderDelaunay.js.map