import { injectable } from "inversify";
import { Graph } from "wasm-dijkstra";
import { IShortestPathAlgorithm } from "../pathfinder";

@injectable()
export class DijkstraWasm {
    // todo, reimplement this
    private contents = Graph.new();

    public addEdge(from: string, to: string, weight: number) {
        this.contents.add_edge(from, to, weight);
    }

    public queryDuration(from: string, to: string): number {
        return this.contents.query_distance(from, to);
    }
}
