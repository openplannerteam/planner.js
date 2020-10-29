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
const LocationResolverError_1 = __importDefault(require("../errors/LocationResolverError"));
const types_1 = __importDefault(require("../types"));
const LocationResolverDefault_1 = __importDefault(require("./LocationResolverDefault"));
/**
 * Location resolver that allows stop names as input
 * Falls back to LocationResolverDefault
 */
let LocationResolverConvenience = class LocationResolverConvenience {
    constructor(stopsProvider) {
        this.stopsProvider = stopsProvider;
        this.defaultLocationResolver = new LocationResolverDefault_1.default(this.stopsProvider);
    }
    async resolve(input) {
        if (typeof input === "string" && !this.isId(input)) {
            if (input.includes("geo:")) {
                const expression = /geo:([\-0-9.]+),([\-0-9.]+)/;
                const result = expression.exec(input);
                if (result && result.length) {
                    return {
                        latitude: parseFloat(result[1]),
                        longitude: parseFloat(result[2]),
                    };
                }
            }
            this.allStops = await this.stopsProvider.getAllStops();
            const matchingStop = this.allStops.find((stop) => stop.name === input);
            if (matchingStop) {
                return matchingStop;
            }
            return Promise.reject(new LocationResolverError_1.default(`Location "${input}" is a string, but not an ID and not a valid stop name`));
        }
        return this.defaultLocationResolver.resolve(input);
    }
    isId(testString) {
        return testString.indexOf("http://") === 0 || testString.indexOf("https://") === 0;
    }
};
LocationResolverConvenience = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(types_1.default.StopsProvider)),
    __metadata("design:paramtypes", [Object])
], LocationResolverConvenience);
exports.default = LocationResolverConvenience;
//# sourceMappingURL=LocationResolverConvenience.js.map