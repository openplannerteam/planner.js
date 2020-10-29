export declare class RoutableTileCoordinate {
    zoom: number;
    x: number;
    y: number;
    constructor(zoom: number, x: number, y: number);
    contains(other: RoutableTileCoordinate): boolean;
}
