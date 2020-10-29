"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const asynciterator_1 = require("asynciterator");
class ForwardConnectionIterator extends asynciterator_1.AsyncIterator {
    constructor(provider, options, beginUrl) {
        super();
        this.count = 0;
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
            this.count += 1;
            this.waiting = false;
            this.currentIndex = 0;
            this.readable = true;
            if (this.currentPage.getNextPageId()) {
                // prefetch the next page to reduce IO
                this.connectionsProvider.getByUrl(this.currentPage.getNextPageId());
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
        if (this.count > 25) {
            this.close();
            return null;
        }
        if (this.currentIndex >= this.currentPage.getConnections().length) {
            // end of this page, fetch the next one
            this.fetchPage(this.currentPage.getNextPageId());
            return undefined;
        }
        const item = this.currentPage.getConnections()[this.currentIndex];
        this.currentIndex += 1;
        if (this.options.upperBoundDate && item.departureTime > this.options.upperBoundDate) {
            // no more relevant connections
            this.close();
        }
        return item;
    }
}
exports.default = ForwardConnectionIterator;
//# sourceMappingURL=ForwardConnectionIterator.js.map