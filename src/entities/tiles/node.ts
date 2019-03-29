import ILocation from "../../interfaces/ILocation";

export class RoutableTileNode implements ILocation {
    public static create(id: string) {
        return new RoutableTileNode(id);
    }

    public latitude: number;
    public longitude: number;
    public id: string;

    constructor(id: string) {
        this.id = id;
    }
}

export interface IRoutableTileNodeIndex {
    [id: string]: RoutableTileNode;
}
