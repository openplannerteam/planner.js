import * as turf from "@turf/turf";
import { MultiPolygon, Polygon } from "@turf/turf";
import ILocation from "../../interfaces/ILocation";

export default class GeometryValue {
    public static create(id?: string) {
        return new GeometryValue(id);
    }

    public id: string;
    public area: Polygon | MultiPolygon;

    constructor(id?: string) {
        this.id = id;
    }

    public contains(location: ILocation): boolean {
        const pt = turf.point([location.longitude, location.latitude]); // x, y format
        return turf.booleanPointInPolygon(pt, this.area);
    }
}
