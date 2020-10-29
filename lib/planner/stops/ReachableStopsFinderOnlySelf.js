"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const inversify_1 = require("inversify");
/**
 * This [[IReachableStopsFinder]] just returns the passed source or target stop.
 *
 * This can be a valid strategy to optimize speed if the user doesn't want to travel by foot to another stop
 */
let ReachableStopsFinderOnlySelf = class ReachableStopsFinderOnlySelf {
    async findReachableStops(sourceOrTargetStop, mode, maximumDuration, minimumSpeed) {
        return [{ stop: sourceOrTargetStop, duration: 0 }];
    }
};
ReachableStopsFinderOnlySelf = __decorate([
    inversify_1.injectable()
], ReachableStopsFinderOnlySelf);
exports.default = ReachableStopsFinderOnlySelf;
//# sourceMappingURL=ReachableStopsFinderOnlySelf.js.map