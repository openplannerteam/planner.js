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
const Units_1 = __importDefault(require("../../util/Units"));
/**
 * This [[IReachableStopsFinder]] determines its reachable stops based on the birds's-eye distance
 * to the source or target stop.
 */
let ReachableStopsFinderBirdsEye = class ReachableStopsFinderBirdsEye {
    constructor(stopsProvider) {
        this.stopsProvider = stopsProvider;
    }
    async findReachableStops(sourceOrTargetStop, mode, maximumDuration, minimumSpeed) {
        // Mode can be ignored since birds eye view distance is identical
        const reachableStops = [{ stop: sourceOrTargetStop, duration: 0 }];
        const allStops = await this.stopsProvider.getAllStops();
        allStops.forEach((possibleTarget) => {
            if (Math.abs(sourceOrTargetStop.latitude - possibleTarget.latitude) < 0.05 &&
                Math.abs(sourceOrTargetStop.longitude - possibleTarget.longitude) < 0.05) {
                const distance = Geo_1.default.getDistanceBetweenStops(sourceOrTargetStop, possibleTarget);
                const duration = Units_1.default.toDuration(distance, minimumSpeed);
                if (duration >= 0 && duration <= maximumDuration) {
                    reachableStops.push({ stop: possibleTarget, duration });
                }
            }
        });
        return reachableStops;
    }
};
ReachableStopsFinderBirdsEye = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(types_1.default.StopsProvider)),
    __metadata("design:paramtypes", [Object])
], ReachableStopsFinderBirdsEye);
exports.default = ReachableStopsFinderBirdsEye;
//# sourceMappingURL=ReachableStopsFinderBirdsEye.js.map