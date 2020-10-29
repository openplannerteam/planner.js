"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const asynciterator_1 = require("asynciterator");
const inversify_1 = require("inversify");
const TravelMode_1 = __importDefault(require("../../enums/TravelMode"));
const Geo_1 = __importDefault(require("../../util/Geo"));
const Units_1 = __importDefault(require("../../util/Units"));
const Leg_1 = __importDefault(require("../Leg"));
const Path_1 = __importDefault(require("../Path"));
let RoadPlannerBirdsEye = class RoadPlannerBirdsEye {
    async plan(query) {
        const { from: fromLocations, to: toLocations, minimumWalkingSpeed, maximumWalkingSpeed, maximumWalkingDuration, } = query;
        const paths = [];
        if (fromLocations && toLocations && fromLocations.length && toLocations.length) {
            for (const from of fromLocations) {
                for (const to of toLocations) {
                    const path = this.getPathBetweenLocations(from, to, minimumWalkingSpeed, maximumWalkingSpeed, maximumWalkingDuration);
                    if (path) {
                        paths.push(path);
                    }
                }
            }
        }
        return new asynciterator_1.ArrayIterator(paths);
    }
    getPathBetweenLocations(from, to, minWalkingSpeed, maxWalkingSpeed, maxWalkingDuration) {
        const distance = Geo_1.default.getDistanceBetweenLocations(from, to);
        const minDuration = Units_1.default.toDuration(distance, maxWalkingSpeed);
        const maxDuration = Units_1.default.toDuration(distance, minWalkingSpeed);
        const duration = {
            minimum: minDuration,
            maximum: maxDuration,
            average: (minDuration + maxDuration) / 2,
        };
        if (duration.maximum > maxWalkingDuration) {
            return;
        }
        return new Path_1.default([
            new Leg_1.default(TravelMode_1.default.Walking, [{
                    startLocation: from,
                    stopLocation: to,
                    duration,
                    distance,
                }]),
        ]);
    }
};
RoadPlannerBirdsEye = __decorate([
    inversify_1.injectable()
], RoadPlannerBirdsEye);
exports.default = RoadPlannerBirdsEye;
//# sourceMappingURL=RoadPlannerBirdsEye.js.map