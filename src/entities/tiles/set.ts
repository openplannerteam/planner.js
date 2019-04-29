import { RoutableTileEdgeGraph } from "./graph";
import { IRoutableTileNodeIndex } from "./node";
import { RoutableTile } from "./tile";
import { IRoutableTileWayIndex } from "./way";

export class RoutableTileSet extends RoutableTile {
    public tiles: RoutableTile[];

    constructor(tiles: RoutableTile[], id?: string) {
        super(id, undefined, undefined);  // super legit
        this.tiles = tiles;
    }

    public getWays(): IRoutableTileWayIndex {
        if (!this.ways) {
            const result: IRoutableTileWayIndex = {};
            for (const tile of this.tiles) {
                for (const way of Object.values(tile.getWays())) {
                    if (!result[way.id]) {
                        result[way.id] = way;
                    } else {
                        // creates a new Way instance
                        // avoids overwriting data from the individual tile definitions
                        // otherwise ways might refer to tiles that aren't in the tile
                        result[way.id] = way.mergeDefinitions(result[way.id]);
                    }
                }
            }

            this.ways = result;
        }
        return this.ways;
    }

    public getNodes(): IRoutableTileNodeIndex {
        if (!this.nodes) {
            // todo, make this a reduce
            const result: IRoutableTileNodeIndex = {};
            for (const tile of this.tiles) {
                Object.assign(result, tile.getNodes());
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
