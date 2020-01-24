import GeometryValue from "./geometry";

enum RelationTypes {
    GEOSPATIALLYC_CONTAINS = "https://w3id.org/tree#GeospatiallyContainsRelation",
}

export default class HypermediaTreeRelation {
    public static create(id?: string) {
        return new HypermediaTreeRelation(id);
    }

    public id?: string;
    public type: RelationTypes;
    public geoValue: GeometryValue;
    public node: string;

    constructor(id?: string) {
        this.id = id;
    }
}
