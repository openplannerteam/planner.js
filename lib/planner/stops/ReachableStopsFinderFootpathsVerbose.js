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
const EventBus_1 = __importDefault(require("../../events/EventBus"));
const EventType_1 = __importDefault(require("../../events/EventType"));
const types_1 = __importDefault(require("../../types"));
const ReachableStopsFinderFootpaths_1 = __importDefault(require("./ReachableStopsFinderFootpaths"));
let ReachableStopsFinderFootpathsVerbose = class ReachableStopsFinderFootpathsVerbose extends ReachableStopsFinderFootpaths_1.default {
    constructor(stopsProvider, footpathsProvider) {
        super(stopsProvider, footpathsProvider);
        this.done = new Set();
    }
    async findReachableStops(sourceOrTargetStop, mode, maximumDuration, minimumSpeed) {
        const result = await super.findReachableStops(sourceOrTargetStop, mode, maximumDuration, minimumSpeed);
        if (!this.done.has(sourceOrTargetStop.id)) {
            this.done.add(sourceOrTargetStop.id);
            for (const reachableStop of result) {
                EventBus_1.default.getInstance().emit(EventType_1.default.ReachableTransfer, {
                    from: sourceOrTargetStop,
                    to: reachableStop.stop,
                });
            }
        }
        return result;
    }
};
ReachableStopsFinderFootpathsVerbose = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(types_1.default.StopsProvider)),
    __param(1, inversify_1.inject(types_1.default.FootpathsProvider)),
    __metadata("design:paramtypes", [Object, Object])
], ReachableStopsFinderFootpathsVerbose);
exports.default = ReachableStopsFinderFootpathsVerbose;
//# sourceMappingURL=ReachableStopsFinderFootpathsVerbose.js.map