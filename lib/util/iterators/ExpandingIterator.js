"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const asynciterator_1 = require("asynciterator");
/**
 * An AsyncIterator that allows "writing" items to it externally
 *
 * It uses a buffer internally, so items can be written synchronously and asynchronously
 */
class ExpandingIterator extends asynciterator_1.AsyncIterator {
    constructor() {
        super();
        this.buffer = [];
        this.shouldClose = false;
    }
    read() {
        let item;
        if (this.buffer.length) {
            item = this.buffer.shift();
        }
        else {
            item = null;
            if (this.shouldClose) {
                this.close();
            }
            this.readable = false;
        }
        return item;
    }
    write(item) {
        if (!this.shouldClose) {
            this.buffer.push(item);
            this.readable = true;
        }
    }
    closeAfterFlush() {
        this.shouldClose = true;
    }
}
exports.default = ExpandingIterator;
//# sourceMappingURL=ExpandingIterator.js.map