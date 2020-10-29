"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class IndexThingViewResult {
    constructor() {
        this.contents = {};
    }
    addEntity(entity) {
        this.contents[entity.id] = entity;
    }
    getContents() {
        return this.contents;
    }
}
exports.IndexThingViewResult = IndexThingViewResult;
//# sourceMappingURL=index.js.map