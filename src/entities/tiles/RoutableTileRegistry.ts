import { injectable } from "inversify";
import { IRoutableTileNodeIndex, RoutableTileNode } from "./RoutableTileNode";
import { IRoutableTileWayIndex, RoutableTileWay } from "./RoutableTileWay";

@injectable()
export default class RoutableTileRegistry {
    public static getInstance(): RoutableTileRegistry {
        if (!RoutableTileRegistry.instance) {
            RoutableTileRegistry.instance = new RoutableTileRegistry();
        }

        return RoutableTileRegistry.instance;
    }

    private static instance: RoutableTileRegistry;
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
            // otherwise ways might refer to nodes that aren't in the tile
            this.ways[way.id] = way.mergeDefinitions(this.ways[way.id]);
        }
    }

    public getNode(id: string): RoutableTileNode {
        return this.nodes[id];
    }

    public getWay(id: string): RoutableTileWay {
        return this.ways[id];
    }

    public getNodes(): RoutableTileNode[] {
        return Object.values(this.nodes);
    }

    public getWays(): RoutableTileWay[] {
        return Object.values(this.ways);
    }
}
