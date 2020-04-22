import GeometryValue from "./geometry";

export enum RelationTypes {
    //later nog aanpassen naar uitbreiding via de NAMESPACE, weet nu niet direct hoe het te doen
    //GEOSPATIALLY_CONTAINS = "https://w3id.org/tree#GeospatiallyContainsRelation",
    GEOSPATIALLY_CONTAINS = "tree:GeospatiallyContainsRelation",
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
