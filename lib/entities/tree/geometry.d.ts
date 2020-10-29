import { MultiPolygon, Polygon } from "@turf/turf";
import ILocation from "../../interfaces/ILocation";
export default class GeometryValue {
    static create(id?: string): GeometryValue;
    id: string;
    area: Polygon | MultiPolygon;
    constructor(id?: string);
    contains(location: ILocation): boolean;
}
