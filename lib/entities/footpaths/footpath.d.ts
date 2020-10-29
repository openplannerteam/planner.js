import { DistanceM } from "../../interfaces/units";
export declare class Footpath {
    static create(id: string): Footpath;
    from: string;
    to: string;
    distance: DistanceM;
    id: string;
    constructor(id: string);
}
export interface IFootpathIndex {
    [id: string]: Footpath;
}
