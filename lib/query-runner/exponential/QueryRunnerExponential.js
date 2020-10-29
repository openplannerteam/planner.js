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
const asynciterator_promiseproxy_1 = require("asynciterator-promiseproxy");
const inversify_1 = require("inversify");
const Defaults_1 = __importDefault(require("../../Defaults"));
const InvalidQueryError_1 = __importDefault(require("../../errors/InvalidQueryError"));
const EventBus_1 = __importDefault(require("../../events/EventBus"));
const EventType_1 = __importDefault(require("../../events/EventType"));
const Path_1 = __importDefault(require("../../planner/Path"));
const types_1 = __importDefault(require("../../types"));
const FilterUniqueIterator_1 = __importDefault(require("../../util/iterators/FilterUniqueIterator"));
const FlatMapIterator_1 = __importDefault(require("../../util/iterators/FlatMapIterator"));
const Units_1 = __importDefault(require("../../util/Units"));
const ExponentialQueryIterator_1 = __importDefault(require("./ExponentialQueryIterator"));
/**
 * To improve the user perceived performance, the query gets split into subqueries
 * with exponentially increasing time frames:
 *
 * ```
 * minimumDepartureTime + 15 minutes, 30 minutes, 60 minutes, 120 minutes...
 * ```
 *
 * In the current implementation, the `maximumArrivalTime` is ignored
 */
let QueryRunnerExponential = class QueryRunnerExponential {
    constructor(locationResolver, publicTransportPlannerFactory, roadPlanner) {
        this.eventBus = EventBus_1.default.getInstance();
        this.locationResolver = locationResolver;
        this.publicTransportPlannerFactory = publicTransportPlannerFactory;
        this.roadPlanner = roadPlanner;
    }
    async run(query) {
        const baseQuery = await this.resolveBaseQuery(query);
        if (baseQuery.roadNetworkOnly) {
            return this.roadPlanner.plan(baseQuery);
        }
        else {
            const queryIterator = new ExponentialQueryIterator_1.default(baseQuery, 15 * 60 * 1000);
            const subqueryIterator = new FlatMapIterator_1.default(queryIterator, this.runSubquery.bind(this));
            return new FilterUniqueIterator_1.default(subqueryIterator, Path_1.default.compareEquals);
        }
    }
    runSubquery(query) {
        // TODO investigate if publicTransportPlanner can be reused or reuse some of its aggregated data
        this.eventBus.emit(EventType_1.default.SubQuery, query);
        const planner = this.publicTransportPlannerFactory();
        return new asynciterator_promiseproxy_1.PromiseProxyIterator(() => planner.plan(query));
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
    async resolveBaseQuery(query) {
        // tslint:disable:trailing-comma
        const { minimumWalkingSpeed, maximumWalkingSpeed, walkingSpeed, maximumWalkingDuration, maximumWalkingDistance, minimumTransferDuration, maximumTransferDuration, maximumTransferDistance, maximumTransfers, minimumDepartureTime, excludedTravelModes } = query, other = __rest(query, ["minimumWalkingSpeed", "maximumWalkingSpeed", "walkingSpeed", "maximumWalkingDuration", "maximumWalkingDistance", "minimumTransferDuration", "maximumTransferDuration", "maximumTransferDistance", "maximumTransfers", "minimumDepartureTime", "excludedTravelModes"]);
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
QueryRunnerExponential = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(types_1.default.LocationResolver)),
    __param(1, inversify_1.inject(types_1.default.PublicTransportPlannerFactory)),
    __param(2, inversify_1.inject(types_1.default.RoadPlanner)),
    __metadata("design:paramtypes", [Object, Function, Object])
], QueryRunnerExponential);
exports.default = QueryRunnerExponential;
//# sourceMappingURL=QueryRunnerExponential.js.map