"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var RelationTypes;
(function (RelationTypes) {
    RelationTypes["GEOSPATIALLYC_CONTAINS"] = "https://w3id.org/tree#GeospatiallyContainsRelation";
})(RelationTypes || (RelationTypes = {}));
class HypermediaTreeRelation {
    constructor(id) {
        this.id = id;
    }
    static create(id) {
        return new HypermediaTreeRelation(id);
    }
}
exports.default = HypermediaTreeRelation;
//# sourceMappingURL=relation.js.map