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
const MergeIterator_1 = __importDefault(require("../../util/iterators/MergeIterator"));
const ConnectionSelectors_1 = require("./ConnectionSelectors");
const ConnectionsProviderSingle_1 = __importDefault(require("./ConnectionsProviderSingle"));
let ConnectionsProviderDefault = class ConnectionsProviderDefault {
    constructor(connectionsFetcherFactory, templateFetcher) {
        this.sources = [];
        this.singleProviders = [];
        this.connectionsFetcherFactory = connectionsFetcherFactory;
        this.templateFetcher = templateFetcher;
    }
    addConnectionSource(source) {
        this.sources.push(source);
        this.singleProviders.push(new ConnectionsProviderSingle_1.default(this.connectionsFetcherFactory, source, this.templateFetcher));
    }
    getSources() {
        return this.sources;
    }
    prefetchConnections(lowerBound, upperBound) {
        for (const provider of this.singleProviders) {
            provider.prefetchConnections(lowerBound, upperBound);
        }
    }
    async createIterator(options) {
        const iterators = await Promise.all(this.singleProviders
            .map((provider) => provider.createIterator(options)));
        const selector = options.backward ? ConnectionSelectors_1.backwardsConnectionsSelector : ConnectionSelectors_1.forwardsConnectionSelector;
        if (options.excludedModes) {
            return new MergeIterator_1.default(iterators, selector, true).filter((item) => {
                return !options.excludedModes.has(item.travelMode);
            });
        }
        else {
            return new MergeIterator_1.default(iterators, selector, true);
        }
    }
    async appendIterator(options, existingIterator) {
        const iterators = await Promise.all(this.singleProviders
            .map((provider) => provider.createIterator(options)));
        const selector = options.backward ? ConnectionSelectors_1.backwardsConnectionsSelector : ConnectionSelectors_1.forwardsConnectionSelector;
        const dataListeners = existingIterator.listeners("data");
        const readListeners = existingIterator.listeners("readable");
        const endListeners = existingIterator.listeners("end");
        existingIterator.removeAllListeners();
        const mergedIterator = new MergeIterator_1.default([...iterators, existingIterator], selector, true);
        for (const listener of dataListeners) {
            mergedIterator.addListener("data", listener);
        }
        for (const listener of readListeners) {
            mergedIterator.addListener("readable", listener);
        }
        for (const listener of endListeners) {
            mergedIterator.addListener("end", listener);
        }
        return mergedIterator;
    }
    getByUrl(url) {
        // TODO, if needed this can delegate the call to one of the sub providers
        throw new Error("Not implemented yet");
    }
    getByTime(date) {
        throw new Error("Method not implemented because the semantics would be ambiguous.");
    }
};
ConnectionsProviderDefault = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(types_1.default.ConnectionsFetcherFactory)),
    __param(1, inversify_1.inject(types_1.default.HydraTemplateFetcher)),
    __metadata("design:paramtypes", [Function, Object])
], ConnectionsProviderDefault);
exports.default = ConnectionsProviderDefault;
//# sourceMappingURL=ConnectionsProviderDefault.js.map