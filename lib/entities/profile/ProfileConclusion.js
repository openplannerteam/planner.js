"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ProfileConclusion {
    constructor(id) {
        this.id = id;
    }
    static create(id) {
        return new ProfileConclusion(id);
    }
    getID() {
        return this.id;
    }
}
exports.default = ProfileConclusion;
//# sourceMappingURL=ProfileConclusion.js.map