import { IRoutableTileNodeIndex } from "./node";

export class RoutableTileEdgeGraph {
    public contents = {};

    constructor(nodes: IRoutableTileNodeIndex) {
        for (const id of Object.keys(nodes)) {
            this.contents[id] = {};
        }
    }

    public addEdge(from: string, to: string, weight: number) {
        if (weight === 0) {
            weight = 0.00001; // fucking duplicate nodes
        }
        this.contents[from][to] = weight;
        this.contents[to][from] = weight;
    }

    public addGraph(other: RoutableTileEdgeGraph) {
        for (const kv1 of Object.entries(other.contents)) {
            const [from, weights] = kv1;
            for (const kv2 of Object.entries(weights)) {
                const [to, weight] = kv2;
                this.addEdge(to, from, weight);
            }
        }
    }
}
