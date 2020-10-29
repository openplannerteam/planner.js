"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DatasetDistribution {
    constructor(id) {
        this.id = id;
    }
    static create(id) {
        return new DatasetDistribution(id);
    }
}
exports.default = DatasetDistribution;
//# sourceMappingURL=dataset_distribution.js.map