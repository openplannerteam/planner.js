import RoutableTileRegistry from "../../entities/tiles/RoutableTileRegistry";
import ILocation from "../../interfaces/ILocation";
import { IPathTree } from "../../pathfinding/pathfinder";
declare type Ring = ILocation[];
declare type Polygon = Ring[];
export declare function visualizeConcaveIsochrone(pathTree: IPathTree, maxCost: number, registry: RoutableTileRegistry): Promise<{
    isochrones: any[];
}>;
export declare function visualizeIsochrone(registry: RoutableTileRegistry, pathTree: IPathTree, maxCost: number): {
    isochrones: Polygon[];
};
export {};
