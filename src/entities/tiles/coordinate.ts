export class RoutableTileCoordinate {
    public zoom: number;
    public longitude: number;
    public latitude: number;

    constructor(zoom: number, longitude: number, latitude: number) {
        this.zoom = zoom;
        this.latitude = latitude;
        this.longitude = longitude;
    }
}
