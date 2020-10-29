"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const asynciterator_1 = require("asynciterator");
class BackwardConnectionIterator extends asynciterator_1.AsyncIterator {
    constructor(provider, options, beginUrl) {
        super();
        this.connectionsProvider = provider;
        this.options = options;
        this.waiting = false;
        this.fetchPage(beginUrl);
    }
    async fetchPage(url) {
        if (!this.waiting) {
            // start fetching a page
            this.readable = false;
            this.waiting = true;
            this.currentPage = null;
            this.currentPage = await this.connectionsProvider.getByUrl(url);
            this.waiting = false;
            this.currentIndex = this.currentPage.getConnections().length - 1;
            this.readable = true;
            if (this.currentPage.getPreviousPageId()) {
                // prefetch the next page to reduce IO
                this.connectionsProvider.getByUrl(this.currentPage.getPreviousPageId());
            }
        }
    }
    read() {
        if (this.closed) {
            return undefined;
        }
        if (this.waiting) {
            // waiting for the next page to be fetched
            this.readable = false;
            return undefined;
        }
        if (this.currentIndex < 0) {
            // end of this page, fetch the next one
            this.fetchPage(this.currentPage.getPreviousPageId());
            return undefined;
        }
        const item = this.currentPage.getConnections()[this.currentIndex];
        this.currentIndex -= 1;
        if (this.options.lowerBoundDate && item.departureTime < this.options.lowerBoundDate) {
            // no more relevant connections
            this.close();
        }
        return item;
    }
}
exports.default = BackwardConnectionIterator;
//# sourceMappingURL=BackwardConnectionIterator.js.map