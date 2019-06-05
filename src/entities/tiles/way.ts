import HighwayKind from "../../enums/HighwayKind";

export class RoutableTileWay {
    public static create(id: string) {
        return new RoutableTileWay(id);
    }

    public id: string;
    public segments: string[][];
    public name: string;
    public reachable?: boolean;

    public highwayKind: HighwayKind;
    public maxSpeed: number;

    constructor(id: string) {
        this.id = id;
    }

    public mergeDefinitions(other: RoutableTileWay): RoutableTileWay {
        const result = new RoutableTileWay(this.id);
        result.name = this.name || other.name;
        result.highwayKind = this.highwayKind || other.highwayKind;
        result.maxSpeed = this.maxSpeed !== undefined ? this.maxSpeed : other.maxSpeed;
        if (this.reachable === false || other.reachable === false) {
            result.reachable = false;
        }
        result.segments = [];
        result.segments.concat(this.segments);
        result.segments.concat(other.segments);
        return result;
    }

    public getParts(): Array<[string, string]> {
        const result = [];
        for (const segment of this.segments) {
            for (let i = 0; i < segment.length - 1; i++) {
                result.push([segment[i], segment[i + 1]]);
            }
        }
        return result;
    }
}

export interface IRoutableTileWayIndex {
    [id: string]: RoutableTileWay;
}
