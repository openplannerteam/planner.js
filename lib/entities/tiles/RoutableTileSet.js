"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RoutableTile_1 = require("./RoutableTile");
class RoutableTileSet extends RoutableTile_1.RoutableTile {
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
//# sourceMappingURL=RoutableTileSet.js.map