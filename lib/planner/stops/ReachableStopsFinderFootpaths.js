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
const Units_1 = __importDefault(require("../../util/Units"));
let ReachableStopsFinderFootpaths = class ReachableStopsFinderFootpaths {
    constructor(stopsProvider, footpathsProvider) {
        this.stopsProvider = stopsProvider;
        this.footpathsProvider = footpathsProvider;
    }
    async findReachableStops(sourceOrTargetStop, mode, maximumDuration, minimumSpeed) {
        const reachableStops = [{ stop: sourceOrTargetStop, duration: 0 }];
        const footpaths = await this.footpathsProvider.get(sourceOrTargetStop);
        for (const footpath of Object.values(footpaths)) {
            let otherStop;
            if (sourceOrTargetStop.id === footpath.from) {
                otherStop = await this.stopsProvider.getStopById(footpath.to);
            }
            else if (sourceOrTargetStop.id === footpath.to) {
                otherStop = await this.stopsProvider.getStopById(footpath.from);
            }
            if (otherStop) {
                const duration = Units_1.default.toDuration(footpath.distance, minimumSpeed);
                reachableStops.push({ stop: otherStop, duration, id: footpath.id });
            }
        }
        return reachableStops;
    }
};
ReachableStopsFinderFootpaths = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(types_1.default.StopsProvider)),
    __param(1, inversify_1.inject(types_1.default.FootpathsProvider)),
    __metadata("design:paramtypes", [Object, Object])
], ReachableStopsFinderFootpaths);
exports.default = ReachableStopsFinderFootpaths;
//# sourceMappingURL=ReachableStopsFinderFootpaths.js.map