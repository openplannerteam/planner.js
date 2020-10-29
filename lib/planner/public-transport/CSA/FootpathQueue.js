"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const asynciterator_1 = require("asynciterator");
const tinyqueue_1 = __importDefault(require("tinyqueue"));
class FootpathQueue extends asynciterator_1.AsyncIterator {
    constructor(backwards = false) {
        super();
        if (backwards) {
            this.buffer = new tinyqueue_1.default([], (a, b) => {
                return b.departureTime - a.departureTime;
            });
        }
        else {
            this.buffer = new tinyqueue_1.default([], (a, b) => {
                return a.departureTime - b.departureTime;
            });
        }
        this.readable = true;
        this.shouldClose = false;
        this.setMaxListeners(100);
    }
    read() {
        let item;
        if (this.buffer.length) {
            item = this.buffer.pop();
        }
        else {
            item = null;
        }
        if (this.shouldClose) {
            this.close();
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
exports.default = FootpathQueue;
//# sourceMappingURL=FootpathQueue.js.map