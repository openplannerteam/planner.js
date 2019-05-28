import { injectable } from "inversify";
import { Graph } from "wasm-dijkstra";
import { IShortestPathAlgorithm } from "../pathfinder";

@injectable()
export class DijkstraWasm implements IShortestPathAlgorithm {
    private contents = Graph.new();

    public addEdge(from: string, to: string, weight: number) {
        this.contents.add_edge(from, to, weight);
    }

    public queryDistance(from: string, to: string): number {
        return this.contents.query_distance(from, to);
    }
}
