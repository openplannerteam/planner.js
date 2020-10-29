"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class RoutableTileNode {
    constructor(id) {
        this.id = id;
        this.definedTags = {};
        this.freeformTags = [];
        this.proximity = {};
    }
    static create(id) {
        return new RoutableTileNode(id);
    }
}
exports.RoutableTileNode = RoutableTileNode;
//# sourceMappingURL=RoutableTileNode.js.map