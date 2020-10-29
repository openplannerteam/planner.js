"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ProfileValueReference {
    constructor(id) {
        this.id = id;
    }
    static create(id) {
        return new ProfileValueReference(id);
    }
    getID() {
        return this.id;
    }
    resolve(element) {
        return element[this.from];
    }
}
exports.default = ProfileValueReference;
//# sourceMappingURL=ProfileValueReference.js.map