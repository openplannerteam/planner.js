import ILocation from "../../interfaces/ILocation";
import { DistanceM, DurationMs } from "../../interfaces/units";
import { RoutableTileNode } from "../tiles/RoutableTileNode";
import { RoutableTileWay } from "../tiles/RoutableTileWay";

export default abstract class Profile {
    public abstract getID(): string;

    public abstract isOneWay(way: RoutableTileWay): boolean;
    public abstract hasAccess(way: RoutableTileWay): boolean;

    public abstract getDefaultSpeed(): number;
    public abstract getMaxSpeed(): number;
    public abstract getSpeed(way: RoutableTileWay): number;

    public abstract getDistance(from: ILocation, to: ILocation, way: RoutableTileWay): DistanceM;
    public abstract getDuration(from: ILocation, to: ILocation, way: RoutableTileWay): DurationMs;

    public abstract getMultiplier(way: RoutableTileWay): number;
    public abstract getCost(from: ILocation, to: ILocation, way: RoutableTileWay): number;

    public abstract isObstacle(node: RoutableTileNode): boolean;
    public abstract getObstacleTime(node: RoutableTileNode): DurationMs;
}
