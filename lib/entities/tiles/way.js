"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class RoutableTileWay {
    constructor(id) {
        this.id = id;
        this.distances = [[]];
        this.definedTags = {};
        this.freeformTags = [];
    }
    static create(id) {
        return new RoutableTileWay(id);
    }
    mergeDefinitions(other) {
        const result = new RoutableTileWay(this.id);
        // copy data fields
        Object.assign(result, this);
        Object.assign(result, other);
        const definedTags = Object.assign({}, this.definedTags, other.definedTags);
        result.definedTags = definedTags;
        // special cases
        if (this.reachable === false || other.reachable === false) {
            result.reachable = false;
        }
        // do not modify the existing objects, copy the lists
        result.segments = [];
        result.segments = result.segments.concat(this.segments);
        result.segments = result.segments.concat(other.segments);
        result.distances = [];
        result.distances = result.distances.concat(this.distances);
        result.distances = result.distances.concat(other.distances);
        result.freeformTags = [];
        result.freeformTags = result.freeformTags.concat(this.freeformTags);
        result.freeformTags = result.freeformTags.concat(other.freeformTags);
        return result;
    }
    getParts() {
        const result = [];
        for (let index = 0; index < this.segments.length; index++) {
            const distances = this.distances[index];
            const segment = this.segments[index];
            for (let i = 0; i < segment.length - 1; i++) {
                result.push({ from: segment[i], to: segment[i + 1], distance: distances[i] });
            }
        }
        return result;
    }
}
exports.RoutableTileWay = RoutableTileWay;
//# sourceMappingURL=way.js.map