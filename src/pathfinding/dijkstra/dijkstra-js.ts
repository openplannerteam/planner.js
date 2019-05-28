import { injectable } from "inversify";
import Graph from "node-dijkstra";
import { IShortestPathAlgorithm } from "../pathfinder";

@injectable()
export class Dijkstra implements IShortestPathAlgorithm {
    private contents = {};

    public addEdge(from: string, to: string, weight: number) {
        if (weight === 0) {
            weight = 0.00001; // because duplicate nodes
        }

        if (!this.contents[from]) {
            this.contents[from] = {};
        }

        this.contents[from][to] = weight;
    }

    public queryDistance(from: string, to: string): number {
        const graph = new Graph(this.contents);
        const path = graph.path(from, to, { cost: true });
        return path.cost;
    }
}
