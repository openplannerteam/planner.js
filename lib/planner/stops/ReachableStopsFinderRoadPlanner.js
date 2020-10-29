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
const ReachableStopsFinderMode_1 = __importDefault(require("../../enums/ReachableStopsFinderMode"));
const types_1 = __importDefault(require("../../types"));
const Geo_1 = __importDefault(require("../../util/Geo"));
const Iterators_1 = __importDefault(require("../../util/Iterators"));
const Units_1 = __importDefault(require("../../util/Units"));
/**
 * This [[IReachableStopsFinder]] uses the registered [[IRoadPlanner]] to find reachable stops.
 * It makes an initial selection of stops based on bird's-eye distance, after which a road planner query gets executed
 * for each of these stops.
 */
let ReachableStopsFinderRoadPlanner = class ReachableStopsFinderRoadPlanner {
    constructor(stopsProvider, roadPlanner) {
        this.stopsProvider = stopsProvider;
        this.roadPlanner = roadPlanner;
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
        const allStops = await this.stopsProvider.getAllStops();
        const stopsInsideCircleArea = [];
        for (const stop of allStops) {
            const distance = Geo_1.default.getDistanceBetweenLocations(location, stop);
            const duration = Units_1.default.toDuration(distance, minimumSpeed);
            if (duration >= 0 && duration <= maximumDuration) {
                stopsInsideCircleArea.push(stop);
            }
        }
        const reachableStops = [];
        await Promise.all(stopsInsideCircleArea.map(async (possibleTarget) => {
            const query = Object.assign({}, baseQuery, {
                [otherProp]: [possibleTarget],
            });
            const pathIterator = await this.roadPlanner.plan(query);
            const durationIterator = pathIterator.map((path) => 
            // Minimum speed is passed so sum max duration over all steps
            path.legs.reduce((totalDuration, leg) => totalDuration + leg.getMaximumDuration(), 0));
            const durations = await Iterators_1.default.toArray(durationIterator);
            if (durations.length) {
                const shortestDuration = Math.min(...durations);
                if (shortestDuration < maximumDuration) {
                    reachableStops.push({ stop: possibleTarget, duration: shortestDuration });
                }
            }
        }));
        return reachableStops;
    }
};
ReachableStopsFinderRoadPlanner = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(types_1.default.StopsProvider)),
    __param(1, inversify_1.inject(types_1.default.RoadPlanner)),
    __metadata("design:paramtypes", [Object, Object])
], ReachableStopsFinderRoadPlanner);
exports.default = ReachableStopsFinderRoadPlanner;
//# sourceMappingURL=ReachableStopsFinderRoadPlanner.js.map