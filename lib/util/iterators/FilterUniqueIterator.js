"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const asynciterator_1 = require("asynciterator");
/**
 * An AsyncIterator that emits only the unique items emitted by a source iterator.
 *
 * Uniqueness is determined by a comparator callback function
 *
 * Note: All (unique) items get stored in an array internally
 */
class FilterUniqueIterator extends asynciterator_1.SimpleTransformIterator {
    constructor(source, comparator) {
        super(source, {
            maxBufferSize: 1,
            autoStart: false,
        });
        this.comparator = comparator;
        this.store = [];
    }
    _filter(object) {
        const isUnique = !this.store
            .some((storedObject) => this.comparator(object, storedObject));
        if (isUnique) {
            this.store.push(object);
        }
        return isUnique;
    }
}
exports.default = FilterUniqueIterator;
//# sourceMappingURL=FilterUniqueIterator.js.map