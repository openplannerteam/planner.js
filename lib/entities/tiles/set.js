"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tile_1 = require("./tile");
class RoutableTileSet extends tile_1.RoutableTile {
    constructor(tiles, id) {
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
exports.RoutableTileSet = RoutableTileSet;
//# sourceMappingURL=set.js.map