"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const asynciterator_1 = require("asynciterator");
/**
 * An AsyncIterator that emits a range of items from a source array.
 *
 * Accepts a start and stop index and a step of +1 or -1
 */
class ArrayViewIterator extends asynciterator_1.AsyncIterator {
    constructor(source, startIndex, stopIndex, step) {
        super();
        this.source = source;
        this.startIndex = startIndex;
        this.stopIndex = stopIndex;
        this.step = step;
        if (step > 0 ? stopIndex < startIndex : stopIndex > startIndex) {
            this.close();
            return;
        }
        this.currentIndex = startIndex;
        this.readable = true;
    }
    read() {
        if (this.closed) {
            return null;
        }
        const { step, currentIndex, stopIndex } = this;
        if (step > 0 ? currentIndex > stopIndex : currentIndex < stopIndex) {
            this.close();
            return null;
        }
        const item = this.source[currentIndex];
        this.currentIndex += step;
        return item;
    }
}
exports.default = ArrayViewIterator;
//# sourceMappingURL=ArrayViewIterator.js.map