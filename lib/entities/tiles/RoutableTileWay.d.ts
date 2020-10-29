import Edge from "./edge";
export declare class RoutableTileWay {
    static create(id: string): RoutableTileWay;
    id: string;
    segments: string[][];
    distances?: number[][];
    name: string;
    reachable?: boolean;
    maxSpeed?: number;
    definedTags: object;
    freeformTags: string[];
    constructor(id: string);
    mergeDefinitions(other: RoutableTileWay): RoutableTileWay;
    getParts(): Edge[];
}
export interface IRoutableTileWayIndex {
    [id: string]: RoutableTileWay;
}
