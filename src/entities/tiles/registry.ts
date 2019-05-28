import { injectable } from "inversify";
import { IRoutableTileNodeIndex, RoutableTileNode } from "./node";
import { IRoutableTileWayIndex, RoutableTileWay } from "./way";

@injectable()
export default class RoutableTileRegistry {
    private nodes: IRoutableTileNodeIndex;
    private ways: IRoutableTileWayIndex;

    constructor() {
        this.nodes = {};
        this.ways = {};
    }

    public registerNode(node: RoutableTileNode) {
        this.nodes[node.id] = node;
    }

    public registerWay(way: RoutableTileWay) {
        if (!this.ways[way.id]) {
            this.ways[way.id] = way;
        } else {
            // creates a new Way instance
            // avoids overwriting data from the individual tile definitions
            // otherwise ways might refer to tiles that aren't in the tile
            this.ways[way.id] = way.mergeDefinitions(this.ways[way.id]);
        }
    }

    public getNode(id: string): RoutableTileNode {
        return this.nodes[id];
    }

    public getWay(id: string): RoutableTileWay {
        return this.ways[id];
    }
}
