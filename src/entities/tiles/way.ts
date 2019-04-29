import { RoutableTileNode } from "./node";

export class RoutableTileWay {
    public static create(id: string) {
        return new RoutableTileWay(id);
    }

    public id: string;
    public segments: string[][];
    public label: string;
    public reachable?: boolean;

    constructor(id: string) {
        this.id = id;
    }

    public mergeDefinitions(other: RoutableTileWay): RoutableTileWay {
        const result = new RoutableTileWay(this.id);
        result.label = this.label || other.label;
        if (this.reachable === false || other.reachable === false) {
            result.reachable = false;
        }
        result.segments = [];
        result.segments.concat(this.segments);
        result.segments.concat(other.segments);
        return result;
    }
}

export interface IRoutableTileWayIndex {
    [id: string]: RoutableTileWay;
}
