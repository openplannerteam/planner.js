"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const asynciterator_1 = require("asynciterator");
/**
 * An AsyncIterator that emits the items of a given array in synchronous bursts of 3 items.
 * The bursts happen asynchronously.
 * Optionally accepts an interval (in ms) between each emitted item.
 *
 * This class is most useful in tests
 */
class BurstArrayIterator extends asynciterator_1.BufferedIterator {
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
        const pushOne = () => {
            if (this.currentIndex < this.array.length) {
                self._push(self.array[self.currentIndex++]);
            }
        };
        setTimeout(() => {
            pushOne();
            pushOne();
            pushOne();
            done();
        }, this.interval);
    }
}
exports.default = BurstArrayIterator;
//# sourceMappingURL=BurstArrayIterator.js.map