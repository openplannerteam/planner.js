import { RoutableTile } from "./RoutableTile";

export class RoutableTileSet extends RoutableTile {
    public tiles: RoutableTile[];

    constructor(tiles: RoutableTile[], id?: string) {
        let nodes = new Array();
        let ways = new Array();

        for (const tile of tiles) {
            nodes = nodes.concat(...tile.getNodes());
            ways = ways.concat(...tile.getWays());
        }

        super(id, new Set(nodes), new Set(ways));
        this.tiles = tiles;
    }
}
