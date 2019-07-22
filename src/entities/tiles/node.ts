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

    public barrierKind?: Barrier;
    public highwayKind?: Highway;
    public crossingKind?: Crossing;

    constructor(id: string) {
        this.id = id;
    }
}

export interface IRoutableTileNodeIndex {
    [id: string]: RoutableTileNode;
}
