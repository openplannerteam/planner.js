export class RoutableTileCoordinate {
    public zoom: number;
    public x: number;
    public y: number;

    constructor(zoom: number, x: number, y: number) {
        this.zoom = zoom;
        this.x = x;
        this.y = y;
    }
}
