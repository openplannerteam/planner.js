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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const inversify_1 = require("inversify");
const Geo_1 = __importDefault(require("../../util/Geo"));
const BidirDijkstraInstance_1 = require("../bidirdijkstra/BidirDijkstraInstance");
const DijkstraInstance_1 = require("../dijkstra/DijkstraInstance");
const graph_1 = __importDefault(require("../graph"));
let MixedDijkstraInstance = class MixedDijkstraInstance {
    constructor(graph, locationResolver) {
        this.bidir = new BidirDijkstraInstance_1.BidirDijkstraInstance(graph);
        this.classic = new DijkstraInstance_1.DijkstraInstance(graph);
        this.locationResolver = locationResolver;
    }
    setUseWeightedCost(useWeightedCost) {
        this.bidir.setUseWeightedCost(useWeightedCost);
        this.classic.setUseWeightedCost(useWeightedCost);
    }
    setBreakPoint(on, callback) {
        this.bidir.setBreakPoint(on, callback);
        this.classic.setBreakPoint(on, callback);
    }
    removeBreakPoint(on) {
        this.bidir.removeBreakPoint(on);
        this.classic.removeBreakPoint(on);
    }
    async queryPath(from, to, maxDistance = Infinity) {
        const promises = [this.locationResolver.resolve(from), this.locationResolver.resolve(to)];
        const [fromLocation, toLocation] = await Promise.all(promises);
        const distance = Geo_1.default.getDistanceBetweenLocations(fromLocation, toLocation);
        if (distance < 1000) {
            return this.classic.queryPath(from, to, maxDistance);
        }
        else {
            return this.bidir.queryPath(from, to, maxDistance);
        }
    }
};
MixedDijkstraInstance = __decorate([
    inversify_1.injectable(),
    __metadata("design:paramtypes", [graph_1.default, Object])
], MixedDijkstraInstance);
exports.MixedDijkstraInstance = MixedDijkstraInstance;
//# sourceMappingURL=MixedDijkstraInstance.js.map