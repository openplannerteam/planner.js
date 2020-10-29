"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const asynciterator_1 = require("asynciterator");
/**
 * AsyncIterator that merges a number of source asynciterators based on the passed selector function.
 *
 * The selector function gets passed an array of values read from each of the asynciterators.
 * Values can be undefined if their respective source iterator has ended.
 * The selector function should return the index in that array of the value to select.
 */
class MergeIterator extends asynciterator_1.AsyncIterator {
    /**
     * @param sourceIterators
     * @param selector
     * @param condensed When true, undefined values are filtered from the array passed to the selector function
     */
    constructor(sourceIterators, selector, condensed = false) {
        super();
        this.sourceIterators = sourceIterators;
        this.selector = selector;
        this.setMaxListeners(1000);
        this.values = Array(this.sourceIterators.length).fill(undefined);
        this.waitingForFill = Array(this.sourceIterators.length).fill(false);
        this.readable = true;
        this.condensed = condensed;
        this.addListeners();
    }
    read() {
        const allFilled = this.fillValues();
        if (!allFilled) {
            this.readable = false;
            return null;
        }
        let selectedIndex;
        if (this.condensed) {
            const { values, indexMap } = this.getCondensedValues();
            selectedIndex = indexMap[this.selector(values)];
        }
        else {
            selectedIndex = this.selector(this.values);
        }
        const item = this.values[selectedIndex];
        this.values[selectedIndex] = undefined;
        this.readable = false;
        return item;
    }
    close() {
        for (const iterator of this.sourceIterators) {
            iterator.close();
        }
        super.close();
    }
    fillValues() {
        const allWaiting = this.waitingForFill.every((waiting) => waiting);
        if (allWaiting) {
            return false;
        }
        const allFilled = this.values.every((value) => value !== undefined);
        if (allFilled) {
            return true;
        }
        const allEnded = this.sourceIterators.every((iterator) => iterator.ended);
        if (allEnded) {
            return false;
        }
        let filledValues = 0;
        const filled = () => {
            filledValues++;
            if (filledValues === this.sourceIterators.length) {
                this.readable = true;
            }
        };
        for (let sourceIndex = 0; sourceIndex < this.sourceIterators.length; sourceIndex++) {
            if (this.sourceIterators[sourceIndex].ended) {
                filled();
                continue;
            }
            if (this.values[sourceIndex] !== undefined && this.values[sourceIndex] !== null) {
                filled();
            }
            else {
                this.fillValue(sourceIndex, filled);
            }
        }
        return filledValues === this.sourceIterators.length;
    }
    fillValue(sourceIndex, filled) {
        const iterator = this.sourceIterators[sourceIndex];
        const value = iterator.read();
        if (value || (!iterator.closed && iterator.readable)) {
            this.values[sourceIndex] = value;
            filled();
        }
        else {
            const shouldWait = !this.waitingForFill[sourceIndex];
            if (shouldWait) {
                this.waitingForFill[sourceIndex] = true;
                this.waitForValue(sourceIndex, filled);
            }
        }
    }
    waitForValue(sourceIndex, filled) {
        const iterator = this.sourceIterators[sourceIndex];
        if (iterator.ended) {
            filled();
            return;
        }
        iterator.once("readable", () => {
            const value = iterator.read();
            if (value === null) {
                this.waitForValue(sourceIndex, filled);
            }
            else {
                this.values[sourceIndex] = value;
                this.waitingForFill[sourceIndex] = false;
                filled();
            }
        });
    }
    getCondensedValues() {
        const values = [];
        const indexMap = [];
        this.values
            .forEach((value, originalIndex) => {
            if (value !== undefined && value !== null) {
                values.push(value);
                indexMap.push(originalIndex);
            }
        }, {});
        return { values, indexMap };
    }
    addListeners() {
        const self = this;
        for (const iterator of this.sourceIterators) {
            iterator.on("end", () => {
                const allEnded = this.sourceIterators.every((iter) => iter.ended);
                if (allEnded) {
                    this.close();
                }
            });
        }
    }
}
exports.default = MergeIterator;
//# sourceMappingURL=MergeIterator.js.map