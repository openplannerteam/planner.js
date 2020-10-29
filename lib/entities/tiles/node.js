"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class RoutableTileNode {
    constructor(id) {
        this.id = id;
        this.definedTags = {};
        this.freeformTags = [];
    }
    static create(id) {
        return new RoutableTileNode(id);
    }
}
exports.RoutableTileNode = RoutableTileNode;
//# sourceMappingURL=node.js.map