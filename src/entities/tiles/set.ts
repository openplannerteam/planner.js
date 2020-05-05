import { RoutableTile } from "./tile";
import { TransitTile } from './tile';
import GeometryValue from "../tree/geometry";
import { RoutableTileCoordinate } from "./coordinate";

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

export class TransitTileSet extends TransitTile {
    public tiles: TransitTile[];

    constructor(tiles: TransitTile[], id?: string){
        let nodes = new Array();
        let ways = new Array();
        //this is about the geospatiallycontains relations (or other ones in the future)
        let relations = new Array();
        let area = new GeometryValue();
        let coordinate : RoutableTileCoordinate;

        for(const tile of tiles){
            nodes = nodes.concat(...tile.getNodes());
            ways = ways.concat(...tile.getWays());
            //!! watch out, nodes and ways are stored as strings, relations are stored as HypermediaTreeRelation objects
            relations = relations.concat(...tile.getRelations());
            area = tile.getArea();
            coordinate = tile.getCoordinate();
        }

        super(id, new Set(nodes), new Set(ways), area, coordinate, new Set(relations));
        this.tiles = tiles;
    }
}
