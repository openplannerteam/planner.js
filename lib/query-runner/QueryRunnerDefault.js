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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const inversify_1 = require("inversify");
const Defaults_1 = __importDefault(require("../Defaults"));
const InvalidQueryError_1 = __importDefault(require("../errors/InvalidQueryError"));
const types_1 = __importDefault(require("../types"));
const Units_1 = __importDefault(require("../util/Units"));
/**
 * The default `minimumDepartureTime` is *now*. The default `maximumArrivalTime` is `minimumDepartureTime + 2 hours`.
 */
let QueryRunnerDefault = class QueryRunnerDefault {
    constructor(locationResolver, publicTransportPlanner, roadPlanner) {
        this.locationResolver = locationResolver;
        this.publicTransportPlanner = publicTransportPlanner;
        this.roadPlanner = roadPlanner;
    }
    async run(query) {
        const resolvedQuery = await this.resolveQuery(query);
        if (resolvedQuery.roadNetworkOnly) {
            return this.roadPlanner.plan(resolvedQuery);
        }
        else {
            return this.publicTransportPlanner.plan(resolvedQuery);
        }
    }
    async resolveEndpoint(endpoint) {
        if (Array.isArray(endpoint)) {
            const promises = endpoint
                .map((singleEndpoint) => this.locationResolver.resolve(singleEndpoint));
            return await Promise.all(promises);
        }
        else {
            return [await this.locationResolver.resolve(endpoint)];
        }
    }
    async resolveQuery(query) {
        // tslint:disable:trailing-comma
        const { minimumWalkingSpeed, maximumWalkingSpeed, walkingSpeed, maximumWalkingDuration, maximumWalkingDistance, minimumTransferDuration, maximumTransferDuration, maximumTransferDistance, maximumTransfers, minimumDepartureTime, maximumArrivalTime, excludedTravelModes } = query, other = __rest(query, ["minimumWalkingSpeed", "maximumWalkingSpeed", "walkingSpeed", "maximumWalkingDuration", "maximumWalkingDistance", "minimumTransferDuration", "maximumTransferDuration", "maximumTransferDistance", "maximumTransfers", "minimumDepartureTime", "maximumArrivalTime", "excludedTravelModes"]);
        // tslint:enable:trailing-comma
        // make a deep copy of these
        let { from, to } = other;
        from = JSON.parse(JSON.stringify(from));
        to = JSON.parse(JSON.stringify(to));
        const resolvedQuery = Object.assign({}, other);
        if (excludedTravelModes) {
            resolvedQuery.excludedTravelModes = new Set(excludedTravelModes);
        }
        resolvedQuery.minimumDepartureTime = minimumDepartureTime || new Date();
        if (maximumArrivalTime) {
            resolvedQuery.maximumArrivalTime = maximumArrivalTime;
        }
        else {
            const { minimumDepartureTime: newDepartureTime } = resolvedQuery;
            resolvedQuery.maximumArrivalTime = new Date(newDepartureTime.getTime()
                + 12 * 60 * 60 * 1000);
        }
        try {
            resolvedQuery.from = await this.resolveEndpoint(from);
            resolvedQuery.to = await this.resolveEndpoint(to);
        }
        catch (e) {
            return Promise.reject(new InvalidQueryError_1.default(e));
        }
        resolvedQuery.minimumWalkingSpeed = minimumWalkingSpeed || walkingSpeed || Defaults_1.default.defaultMinimumWalkingSpeed;
        resolvedQuery.maximumWalkingSpeed = maximumWalkingSpeed || walkingSpeed || Defaults_1.default.defaultMaximumWalkingSpeed;
        resolvedQuery.maximumWalkingDuration = maximumWalkingDuration ||
            Units_1.default.toDuration(maximumWalkingDistance, resolvedQuery.minimumWalkingSpeed) || Defaults_1.default.defaultWalkingDuration;
        resolvedQuery.minimumTransferDuration = minimumTransferDuration || Defaults_1.default.defaultMinimumTransferDuration;
        resolvedQuery.maximumTransferDuration = maximumTransferDuration ||
            Units_1.default.toDuration(maximumTransferDistance, resolvedQuery.minimumWalkingSpeed) ||
            Defaults_1.default.defaultMaximumTransferDuration;
        resolvedQuery.maximumTransfers = maximumTransfers || Defaults_1.default.defaultMaximumTransfers;
        return resolvedQuery;
    }
};
QueryRunnerDefault = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(types_1.default.LocationResolver)),
    __param(1, inversify_1.inject(types_1.default.PublicTransportPlanner)),
    __param(2, inversify_1.inject(types_1.default.RoadPlanner)),
    __metadata("design:paramtypes", [Object, Object, Object])
], QueryRunnerDefault);
exports.default = QueryRunnerDefault;
//# sourceMappingURL=QueryRunnerDefault.js.map