import Barrier from "../../enums/Barrier";
import Crossing from "../../enums/Crossing";
import Highway from "../../enums/Highway";
import ILocation from "../../interfaces/ILocation";

export class RoutableTileNode implements ILocation {
    public static create(id: string) {
        return new RoutableTileNode(id);
    }

    public latitude: number;
    public longitude: number;
    public id: string;

    public definedTags: object;
    public freeformTags: string[];

    public proximity;

    constructor(id: string) {
        this.id = id;
        this.definedTags = {};
        this.freeformTags = [];
        this.proximity = {};
    }
}

export interface IRoutableTileNodeIndex {
    [id: string]: RoutableTileNode;
}
