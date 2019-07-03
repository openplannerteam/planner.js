import IStop from "../../fetcher/stops/IStop";
import { DistanceM } from "../../interfaces/units";

export class Footpath {
    public static create(id: string) {
        return new Footpath(id);
    }

    public from: string;
    public to: string;
    public distance: DistanceM;
    public id: string;

    constructor(id: string) {
        this.id = id;
    }
}

export interface IFootpathIndex {
    [id: string]: Footpath;
}
