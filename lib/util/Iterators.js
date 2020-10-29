"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Utility class with functions to operate on AsyncIterator instances
 */
class Iterators {
    /**
     * Returns an array representation of an AsyncIterator.
     * Assumes the iterator will end sometime
     */
    static toArray(iterator) {
        const array = [];
        iterator.each((item) => array.push(item));
        return new Promise((resolve) => {
            iterator.on("end", () => resolve(array));
        });
    }
    /**
     * Returns the first element of an AsyncIterator.
     */
    static getFirst(iterator) {
        return new Promise((resolve) => {
            iterator.on("readable", () => {
                resolve(iterator.read());
            });
        });
    }
    /**
     * Iterates over elements of an AsyncIterator, returning the first element ´predicate´ returns truthy for.
     */
    static find(iterator, predicate) {
        return new Promise((resolve, reject) => {
            iterator.on("readable", () => {
                let element = iterator.read();
                while (element && !predicate(element)) {
                    element = iterator.read();
                }
                if (element) {
                    resolve(element);
                }
            });
            iterator.on("end", () => resolve(null));
        });
    }
}
exports.default = Iterators;
//# sourceMappingURL=Iterators.js.map