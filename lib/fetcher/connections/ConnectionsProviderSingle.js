"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("../..");
const EventBus_1 = __importDefault(require("../../events/EventBus"));
const MergeIterator_1 = __importDefault(require("../../util/iterators/MergeIterator"));
const BackwardConnectionIterator_1 = __importDefault(require("./BackwardConnectionIterator"));
const ConnectionSelectors_1 = require("./ConnectionSelectors");
const ForwardConnectionIterator_1 = __importDefault(require("./ForwardConnectionIterator"));
class ConnectionsProviderSingle {
    constructor(connectionsFetcherFactory, catalog, templateFetcher) {
        this.pages = {};
        const { accessUrl, travelMode } = catalog;
        this.source = catalog;
        this.fetcher = connectionsFetcherFactory(travelMode);
        this.templateFetcher = templateFetcher;
    }
    addConnectionSource(source) {
        throw new Error("Method not implemented.");
    }
    getSources() {
        return [this.source];
    }
    async getByUrl(url) {
        if (!this.pages[url]) {
            this.pages[url] = this.fetcher.get(url);
        }
        return await this.pages[url];
    }
    async getByTime(date, region) {
        // TODO, look up in the index -- use lower/upper bounds of each page
        const url = await this.getIdForTime(date, region);
        return this.getByUrl(url);
    }
    async getIdForTime(date, region) {
        const template = await this.getTemplate();
        if (region) {
            return template.fill({
                "http://www.opengis.net/ont/geosparql#hasGeometry": region.id,
                "http://semweb.mmlab.be/ns/linkedconnections#departureTimeQuery": date.toISOString(),
            });
        }
        else {
            return template.fill({
                "http://semweb.mmlab.be/ns/linkedconnections#departureTimeQuery": date.toISOString(),
            });
        }
    }
    prefetchConnections(lowerBound, upperBound) {
        this.createIterator({
            upperBoundDate: upperBound,
            lowerBoundDate: lowerBound,
            region: null,
        }).then((iterator) => {
            iterator.on("readable", () => {
                while (iterator.read()) {
                    //
                }
            });
        });
    }
    async appendIterator(options, existingIterator) {
        EventBus_1.default.getInstance().emit(__1.EventType.ConnectionIteratorView, {
            lowerBound: options.lowerBoundDate,
            upperBound: options.upperBoundDate,
        });
        const selector = options.backward ? ConnectionSelectors_1.backwardsConnectionsSelector : ConnectionSelectors_1.forwardsConnectionSelector;
        let iterator;
        if (options.backward) {
            const beginTime = options.upperBoundDate;
            const beginUrl = await this.getIdForTime(beginTime, options.region);
            iterator = new BackwardConnectionIterator_1.default(this, options, beginUrl);
        }
        else {
            const beginTime = options.lowerBoundDate;
            const beginUrl = await this.getIdForTime(beginTime, options.region);
            iterator = new ForwardConnectionIterator_1.default(this, options, beginUrl);
        }
        const dataListeners = existingIterator.listeners("data");
        const readListeners = existingIterator.listeners("readable");
        const endListeners = existingIterator.listeners("end");
        existingIterator.removeAllListeners();
        const mergedIterator = new MergeIterator_1.default([iterator, existingIterator], selector, true);
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
    async createIterator(options) {
        EventBus_1.default.getInstance().emit(__1.EventType.ConnectionIteratorView, {
            lowerBound: options.lowerBoundDate,
            upperBound: options.upperBoundDate,
        });
        let iterator;
        if (options.backward) {
            const beginTime = options.upperBoundDate;
            const beginUrl = await this.getIdForTime(beginTime, options.region);
            iterator = new BackwardConnectionIterator_1.default(this, options, beginUrl);
        }
        else {
            const beginTime = options.lowerBoundDate;
            const beginUrl = await this.getIdForTime(beginTime, options.region);
            iterator = new ForwardConnectionIterator_1.default(this, options, beginUrl);
        }
        return iterator.on("end", () => {
            EventBus_1.default.getInstance().emit(__1.EventType.ConnectionIteratorView, {
                lowerBound: options.lowerBoundDate,
                upperBound: options.upperBoundDate,
                finished: true,
            });
        });
    }
    async getTemplate() {
        if (!this.template) {
            this.template = this.templateFetcher.get(this.source.accessUrl);
        }
        return this.template;
    }
}
exports.default = ConnectionsProviderSingle;
//# sourceMappingURL=ConnectionsProviderSingle.js.map