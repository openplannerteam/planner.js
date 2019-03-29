import { RoutableTileEdgeGraph } from "./graph";
import { IRoutableTileNodeIndex } from "./node";
import { RoutableTile } from "./tile";
import { IRoutableTileWayIndex } from "./way";

export class RoutableTileSet {
    public tiles: RoutableTile[];
    private nodes: IRoutableTileNodeIndex;
    private ways: IRoutableTileWayIndex;
    private edgeGraph: RoutableTileEdgeGraph;

    constructor(tiles: RoutableTile[]) {
        this.tiles = tiles;
    }

    public getNodes(): IRoutableTileNodeIndex {
        if (!this.nodes) {
            // todo, make this a reduce
            const result: IRoutableTileNodeIndex = {};
            for (const tile of this.tiles) {
                Object.assign(result, tile.nodes);
            }

            this.nodes = result;
        }
        return this.nodes;
    }

    public getEdgeGraph() {
        if (!this.edgeGraph) {
            const result = new RoutableTileEdgeGraph(this.getNodes());

            for (const tile of this.tiles) {
                const edgeGraph = tile.getEdgeGraph();
                result.addGraph(edgeGraph);
            }

            this.edgeGraph = result;
        }
        return this.edgeGraph;
    }
}
