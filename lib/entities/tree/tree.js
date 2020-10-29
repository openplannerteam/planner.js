"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class HypermediaTree {
    constructor(id) {
        this.id = id;
    }
    static create(id) {
        return new HypermediaTree(id);
    }
}
exports.default = HypermediaTree;
//# sourceMappingURL=tree.js.map