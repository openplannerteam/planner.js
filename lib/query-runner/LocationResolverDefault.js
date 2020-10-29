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
const RoutableTileRegistry_1 = __importDefault(require("../entities/tiles/RoutableTileRegistry"));
const LocationResolverError_1 = __importDefault(require("../errors/LocationResolverError"));
const types_1 = __importDefault(require("../types"));
/**
 * This default location resolver resolves [[ILocation]] instances by their `id` (`http(s)://...`)
 *
 * If only an `id` string is passed, it returns an [[ILocation]] with all available information.
 *
 * If an incomplete [[ILocation]] (but with an `id`) is passed, it gets supplemented as well.
 */
let LocationResolverDefault = class LocationResolverDefault {
    constructor(stopsProvider) {
        this.stopsProvider = stopsProvider;
        this.tileRegistry = RoutableTileRegistry_1.default.getInstance();
    }
    async resolve(input) {
        if (typeof input === "string") {
            if (this.isId(input)) {
                return this.resolveById(input);
            }
            return Promise.reject(new LocationResolverError_1.default(`Location "${input}" is a string, but not an ID`));
        }
        const location = input;
        const hasId = "id" in location;
        const hasCoords = "latitude" in location && "longitude" in location;
        if (hasId) {
            const resolvedLocation = await this.resolveById(location.id);
            return Object.assign({}, location, resolvedLocation);
        }
        if (!hasCoords) {
            return Promise.reject(new LocationResolverError_1.default(`Location "${JSON.stringify(input)}" should have latitude and longitude`));
        }
        if (typeof location.latitude !== "number") {
            location.latitude = parseFloat(location.latitude);
        }
        if (typeof location.longitude !== "number") {
            location.longitude = parseFloat(location.longitude);
        }
        return location;
    }
    async resolveById(id) {
        const node = this.tileRegistry.getNode(id);
        if (node) {
            return node;
        }
        const stop = await this.stopsProvider.getStopById(id);
        if (stop) {
            return stop;
        }
        return Promise.reject(new LocationResolverError_1.default(`No fetcher for id ${id}`));
    }
    isId(testString) {
        return testString.indexOf("http://") === 0 || testString.indexOf("https://") === 0;
    }
};
LocationResolverDefault = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(types_1.default.StopsProvider)),
    __metadata("design:paramtypes", [Object])
], LocationResolverDefault);
exports.default = LocationResolverDefault;
//# sourceMappingURL=LocationResolverDefault.js.map