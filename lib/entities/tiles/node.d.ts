import ILocation from "../../interfaces/ILocation";
export declare class RoutableTileNode implements ILocation {
    static create(id: string): RoutableTileNode;
    latitude: number;
    longitude: number;
    id: string;
    definedTags: object;
    freeformTags: string[];
    constructor(id: string);
}
export interface IRoutableTileNodeIndex {
    [id: string]: RoutableTileNode;
}
