import ILocation from "../../interfaces/ILocation";
import { DistanceM, DurationMs } from "../../interfaces/units";
import { RoutableTileNode } from "../tiles/RoutableTileNode";
import { RoutableTileWay } from "../tiles/RoutableTileWay";
export default abstract class Profile {
    abstract getID(): string;
    abstract isOneWay(way: RoutableTileWay): boolean;
    abstract hasAccess(way: RoutableTileWay): boolean;
    abstract getDefaultSpeed(): number;
    abstract getMaxSpeed(): number;
    abstract getSpeed(way: RoutableTileWay): number;
    abstract getDistance(from: ILocation, to: ILocation, way: RoutableTileWay): DistanceM;
    abstract getDuration(from: ILocation, to: ILocation, way: RoutableTileWay): DurationMs;
    abstract getMultiplier(way: RoutableTileWay): number;
    abstract getCost(from: ILocation, to: ILocation, way: RoutableTileWay): number;
    abstract isObstacle(node: RoutableTileNode): boolean;
    abstract getObstacleTime(node: RoutableTileNode): DurationMs;
}
