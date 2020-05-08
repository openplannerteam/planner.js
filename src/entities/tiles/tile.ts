import ILocation from "../../interfaces/ILocation";
import { RoutableTileCoordinate } from "./coordinate";
import HypermediaTreeRelation from "../tree/relation";
import GeometryValue from "../tree/geometry";

function tile_to_lat(coordinate: RoutableTileCoordinate) {
    // from https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
    const n = Math.PI - 2 * Math.PI * coordinate.y / Math.pow(2, coordinate.zoom);
    return (180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
}

function tile_to_long(coordinate: RoutableTileCoordinate) {
    // from https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
    return (coordinate.x / Math.pow(2, coordinate.zoom) * 360 - 180);
}

export class RoutableTile {
    public id: string;
    public area : GeometryValue;
    public coordinate?: RoutableTileCoordinate;
    protected nodes: Set<string>;
    protected ways: Set<string>;
    protected relations: Set<HypermediaTreeRelation>;

    constructor(id: string, nodes: Set<string>, ways: Set<string>, area?: GeometryValue,coordinate?: RoutableTileCoordinate, relations?: Set<HypermediaTreeRelation>) {
        this.id = id;
        this.nodes = nodes;
        this.ways = ways;
        this.relations = relations;
        this.area = area;
        this.coordinate = coordinate;
    }

    public getCoordinate(): RoutableTileCoordinate{
        return this.coordinate;
    }

    public getWays() {
        return this.ways;
    }

    public getNodes() {
        return this.nodes;
    }

    public getArea(): GeometryValue {
        return this.area;
    }

    public getRelations(){
        return this.relations;
    }

    public containsGeoValue(location: ILocation): boolean{
        if(this.area.area){
            return this.area.contains(location);
        }
        else{
            return this.contains(location);
        }
    }

    public contains(location: ILocation): boolean {
        const top = tile_to_lat(this.coordinate);
        const left = tile_to_long(this.coordinate);

        const next = new RoutableTileCoordinate(this.coordinate.zoom, this.coordinate.x + 1, this.coordinate.y + 1);

        const bottom = tile_to_lat(next);
        const right = tile_to_long(next);

        if (location.latitude > top || location.latitude < bottom) {
            return false;
        } else if (location.longitude < left || location.longitude > right) {
            return false;
        }
        return true;
    }
}

export class TransitTile {
    public id: string;
    //routabletilecoordinate is the same as a transit tile coordinate so atm this is good enough
    public coordinate?: RoutableTileCoordinate;
    public area : GeometryValue;
    protected nodes: Set<string>;
    protected ways: Set<string>;
    protected relations: Set<HypermediaTreeRelation>;

    constructor(id: string, nodes: Set<string>, ways: Set<string>, area: GeometryValue, coordinate?: RoutableTileCoordinate, relations?: Set<HypermediaTreeRelation>) {
        this.id = id;
        this.nodes = nodes;
        this.ways = ways;
        this.relations = relations;
        this.area = area;
        this.coordinate = coordinate;
    }

    public getWays() {
        return this.ways;
    }

    public getNodes() {
        return this.nodes;
    }

    public getRelations(){
        return this.relations;
    }

    public getArea(): GeometryValue {
        return this.area;
    }

    public getCoordinate(): RoutableTileCoordinate{
        return this.coordinate;
    }

    public containsGeoValue(location: ILocation): boolean{
        return this.area.contains(location);
    }


    public contains(location: ILocation): boolean {
        const top = tile_to_lat(this.coordinate);
        const left = tile_to_long(this.coordinate);

        //same here
        const next = new RoutableTileCoordinate(this.coordinate.zoom, this.coordinate.x + 1, this.coordinate.y + 1);

        const bottom = tile_to_lat(next);
        const right = tile_to_long(next);

        if (location.latitude > top || location.latitude < bottom) {
            return false;
        } else if (location.longitude < left || location.longitude > right) {
            return false;
        }
        return true;
    }
}

export interface IRoutableTileIndex {
    [id: string]: Promise<RoutableTile>;
}

export interface ITransitTileIndex {
    [id: string]: Promise<TransitTile>;
}
