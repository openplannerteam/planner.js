import Edge from "./edge";

export class RoutableTileWay {
    public static create(id: string) {
        return new RoutableTileWay(id);
    }

    public id: string;
    public segments: string[][]; // ids of nodes that are part of this road
    public distances?: number[][]; // distances between the nodes in the segments
    public name: string;
    public reachable?: boolean; // not part of OSM but a result of preprocessing, do not use this (yet)
    public maxSpeed?: number;

    public definedTags: object;
    public freeformTags: string[];

    constructor(id: string) {
        this.id = id;
        this.distances = [[]];
        this.definedTags = {};
        this.freeformTags = [];
    }

    public mergeDefinitions(other: RoutableTileWay): RoutableTileWay {
        const result = new RoutableTileWay(this.id);
        // copy data fields
        Object.assign(result, this);
        Object.assign(result, other);
        const definedTags = Object.assign({}, this.definedTags, other.definedTags);
        result.definedTags = definedTags;
        // special cases
        if (this.reachable === false || other.reachable === false) {
            result.reachable = false;
        }
        // do not modify the existing objects, copy the lists
        result.segments = [];
        result.segments = result.segments.concat(this.segments);
        result.segments = result.segments.concat(other.segments);

        result.distances = [];
        result.distances = result.distances.concat(this.distances);
        result.distances = result.distances.concat(other.distances);

        result.freeformTags = [];
        result.freeformTags = result.freeformTags.concat(this.freeformTags);
        result.freeformTags = result.freeformTags.concat(other.freeformTags);
        return result;
    }

    public getParts(): Edge[] {
        const result: Edge[] = [];
        for (let index = 0; index < this.segments.length; index++) {
            const distances = this.distances[index];
            const segment = this.segments[index];
            for (let i = 0; i < segment.length - 1; i++) {
                result.push({from: segment[i], to: segment[i + 1], distance: distances[i]});
            }
        }
        return result;
    }
}

export interface IRoutableTileWayIndex {
    [id: string]: RoutableTileWay;
}
