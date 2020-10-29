import GeometryValue from "./geometry";
declare enum RelationTypes {
    GEOSPATIALLYC_CONTAINS = "https://w3id.org/tree#GeospatiallyContainsRelation"
}
export default class HypermediaTreeRelation {
    static create(id?: string): HypermediaTreeRelation;
    id?: string;
    type: RelationTypes;
    geoValue: GeometryValue;
    node: string;
    constructor(id?: string);
}
export {};
