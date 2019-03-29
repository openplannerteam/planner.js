import { RoutableTileNode } from "./node";

export class RoutableTileWay {
    public static create(id: string) {
        return new RoutableTileWay(id);
    }

    public id: string;
    public segments: string[][];
    public label: string;

    constructor(id: string) {
        this.id = id;
    }
}

export interface IRoutableTileWayIndex {
    [id: string]: RoutableTileWay;
}
