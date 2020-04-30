export default class TileCoordinate {
    public zoom: number;
    public x: number;
    public y: number;

    constructor(zoom: number, x: number, y: number) {
        this.zoom = zoom;
        this.x = x;
        this.y = y;
    }

    public contains(other: TileCoordinate): boolean {
        const n = Math.pow(2, other.zoom - this.zoom);
        const otherX = Math.floor(other.x / n);
        const otherY = Math.floor(other.y / n);
        if (otherX === this.x && otherY === this.y) {
            return true;
        } else {
            return false;
        }
    }
}
