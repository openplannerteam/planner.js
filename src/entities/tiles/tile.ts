import ILocation from "../../interfaces/ILocation";
import Geo from "../../util/Geo";
import { RoutableTileCoordinate } from "./coordinate";
import { RoutableTileEdgeGraph } from "./graph";
import { IRoutableTileNodeIndex } from "./node";
import { IRoutableTileWayIndex } from "./way";

export class RoutableTile {
    public id: string;
    public coordinate?: RoutableTileCoordinate;
    public nodes: IRoutableTileNodeIndex;
    public ways: IRoutableTileWayIndex;

    private edgeGraph: RoutableTileEdgeGraph;

    constructor(id: string, nodes: IRoutableTileNodeIndex, ways: IRoutableTileWayIndex) {
        this.id = id;
        this.nodes = nodes;
        this.ways = ways;
    }

    public getEdgeGraph() {
        if (!this.edgeGraph) {
            const result = new RoutableTileEdgeGraph(this.nodes);

            for (const way of Object.values(this.ways)) {
                for (const segment of way.segments) {
                    for (let i = 0; i < segment.length - 1; i++) {
                        const nodeA = segment[i];
                        const from: ILocation = this.nodes[nodeA];
                        const nodeB = segment[i + 1];
                        const to: ILocation = this.nodes[nodeB];
                        const distance = Geo.getDistanceBetweenLocations(from, to);
                        result.addEdge(nodeA, nodeB, distance);
                    }
                }
            }

            this.edgeGraph = result;
        }
        return this.edgeGraph;
    }
}

export interface IRoutableTileIndex {
    [id: string]: RoutableTile;
}
