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

export class RoutableTileWay {
    public static create(id: string) {
        return new RoutableTileWay(id);
    }

    public id: string;
    public segments: string[][]; // ids of nodes that are part of this road
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
        return result;
    }

    public getParts(): Array<[string, string]> {
        /**
         * Returns pairs of node IDs that are connected because of this road.
         */
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
