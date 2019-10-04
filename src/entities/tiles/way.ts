import Access from "../../enums/Access";
import Construction from "../../enums/Construction";
import Crossing from "../../enums/Crossing";
import Cycleway from "../../enums/Cycleway";
import Footway from "../../enums/Footway";
import Highway from "../../enums/Highway";
import Oneway from "../../enums/Oneway";
import Smoothness from "../../enums/Smoothness";
import Surface from "../../enums/Surface";
import TrackType from "../../enums/TrackType";
import Edge from "./edge";

export class RoutableTileWay {
    public static create(id: string) {
        return new RoutableTileWay(id);
    }

    public id: string;
    public segments: string[][]; // ids of nodes that are part of this road
    public weights?: number[][]; // distances between the nodes in the segments
    public name: string;
    public reachable?: boolean; // not part of OSM but a result of preprocessing, do not use this (yet)

    public accessRestrictions?: Access;
    public bicycleAccessRestrictions?: Access;
    public constructionKind?: Construction;
    public crossingKind?: Crossing;
    public cyclewayKind?: Cycleway;
    public footwayKind?: Footway;
    public highwayKind: Highway;
    public maxSpeed: number;
    public motorVehicleAccessRestrictions?: Access;
    public motorcarAccessRestrictions?: Access;
    public onewayBicycleKind?: Oneway;
    public onewayKind?: Oneway;
    public smoothnessKind?: Smoothness;
    public surfaceKind?: Surface;
    public trackType?: TrackType;
    public vehicleAccessRestrictions?: Access;

    constructor(id: string) {
        this.id = id;
        this.weights = [[]];
    }

    public mergeDefinitions(other: RoutableTileWay): RoutableTileWay {
        const result = new RoutableTileWay(this.id);
        // copy data fields
        Object.assign(result, this);
        Object.assign(result, other);
        // special cases
        if (this.reachable === false || other.reachable === false) {
            result.reachable = false;
        }
        // do not modify the existing objects, copy the lists
        result.segments = [];
        result.segments = result.segments.concat(this.segments);
        result.segments = result.segments.concat(other.segments);

        result.weights = [];
        result.weights = result.weights.concat(this.weights);
        result.weights = result.weights.concat(other.weights);
        return result;
    }

    public getParts(): Edge[] {
        const result: Edge[] = [];
        for (let index = 0; index < this.segments.length; index++) {
            const weights = this.weights[index];
            const segment = this.segments[index];
            for (let i = 0; i < segment.length - 1; i++) {
                result.push({from: segment[i], to: segment[i + 1], distance: weights[i]});
            }
        }
        return result;
    }
}

export interface IRoutableTileWayIndex {
    [id: string]: RoutableTileWay;
}
