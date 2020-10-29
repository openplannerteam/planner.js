"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const asynciterator_1 = require("asynciterator");
/**
 * An AsyncIterator that emits the items of a given array, asynchronously.
 * Optionally accepts an interval (in ms) between each emitted item
 *
 * This class is most useful in tests
 */
class AsyncArrayIterator extends asynciterator_1.BufferedIterator {
    constructor(array, interval = 0) {
        super();
        this.currentIndex = 0;
        this.array = array;
        this.interval = interval;
    }
    _read(count, done) {
        if (this.currentIndex === this.array.length) {
            this.close();
            return done();
        }
        const self = this;
        setTimeout(() => {
            self._push(self.array[self.currentIndex++]);
            done();
        }, this.interval);
    }
}
exports.default = AsyncArrayIterator;
//# sourceMappingURL=AsyncArrayIterator.js.map