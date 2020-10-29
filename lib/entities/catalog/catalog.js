"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Catalog {
    constructor(id) {
        this.id = id;
    }
    static create(id) {
        return new Catalog(id);
    }
}
exports.Catalog = Catalog;
//# sourceMappingURL=catalog.js.map