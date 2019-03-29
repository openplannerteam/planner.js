import { IRoutableTileNodeIndex } from "./node";
import { IRoutableTileWayIndex } from "./way";

export class RoutableTile {
    public id: string;
    public latitude?: number;
    public longitude?: number;
    public nodes: IRoutableTileNodeIndex;
    public ways: IRoutableTileWayIndex;

    constructor(id: string, nodes: IRoutableTileNodeIndex, ways: IRoutableTileWayIndex) {
        this.id = id;
        this.nodes = nodes;
        this.ways = ways;
    }
}
