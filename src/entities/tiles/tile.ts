import { RoutableTileCoordinate } from "./coordinate";

export class RoutableTile {
    public id: string;
    public coordinate?: RoutableTileCoordinate;
    protected nodes: Set<string>;
    protected ways: Set<string>;

    constructor(id: string, nodes: Set<string>, ways: Set<string>) {
        this.id = id;
        this.nodes = nodes;
        this.ways = ways;
    }

    public getWays() {
        return this.ways;
    }

    public getNodes() {
        return this.nodes;
    }
}

export interface IRoutableTileIndex {
    [id: string]: Promise<RoutableTile>;
}
