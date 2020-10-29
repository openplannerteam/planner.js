export default class TileCoordinate {
    zoom: number;
    x: number;
    y: number;
    constructor(zoom: number, x: number, y: number);
    contains(other: TileCoordinate): boolean;
}
