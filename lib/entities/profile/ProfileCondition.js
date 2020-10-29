"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ProfileCondition {
    constructor(id) {
        this.id = id;
    }
    static create(id) {
        return new ProfileCondition(id);
    }
    getID() {
        return this.id;
    }
}
exports.default = ProfileCondition;
//# sourceMappingURL=ProfileCondition.js.map