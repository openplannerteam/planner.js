"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ProfileRule {
    constructor(id) {
        this.id = id;
    }
    static create(id) {
        return new ProfileRule(id);
    }
    getID() {
        return this.id;
    }
}
exports.default = ProfileRule;
//# sourceMappingURL=ProfileRule.js.map