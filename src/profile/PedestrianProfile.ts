import { RoutableTileNode } from "../entities/tiles/node";
import { RoutableTileWay } from "../entities/tiles/way";
import HighwayKind from "../enums/HighwayKind";
import { DistanceM, DurationMs } from "../interfaces/units";
import Geo from "../util/Geo";
import Profile from "./Profile";

export default class PedestrianProfile extends Profile {
    public getID(): string {
        return "PEDESTRIAN";
    }

    public isOneWay(way: RoutableTileWay): boolean {
        return false;
    }

    public hasAccess(way: RoutableTileWay): boolean {
        if (way.highwayKind === HighwayKind.Motorway) {
            return false;
        } else if (way.highwayKind === HighwayKind.MotorwayLink) {
            return false;
        } else if (way.highwayKind === HighwayKind.Trunk) {
            return false;
        } else if (way.highwayKind === HighwayKind.TrunkLink) {
            return false;
        }

        return true;
    }

    public getDefaultSpeed() {
        return 5;
    }

    public getMaxSpeed() {
        return this.getDefaultSpeed();
    }

    public getSpeed(way: RoutableTileWay) {
        return this.getDefaultSpeed();
    }

    public getDistance(from: RoutableTileNode, to: RoutableTileNode, way: RoutableTileWay): DistanceM {
        return Geo.getDistanceBetweenLocations(from, to);
    }

    public getDuration(from: RoutableTileNode, to: RoutableTileNode, way: RoutableTileWay): DurationMs {
        const distance = this.getDistance(from, to, way) / 1000; // km
        const speed = 5; // km/h
        const time = distance / speed; // h
        return time * 60 * 60 * 1000; // ms
    }

    public getMultiplier(way: RoutableTileWay): number {
        if (way.highwayKind === HighwayKind.Motorway) {
            return 1.3;
        } else if (way.highwayKind === HighwayKind.MotorwayLink) {
            return 1.3;
        } else if (way.highwayKind === HighwayKind.Trunk) {
            return 1.3;
        } else if (way.highwayKind === HighwayKind.TrunkLink) {
            return 1.3;
        } else if (way.highwayKind === HighwayKind.Service) {
            return 1.1;
        } else if (way.highwayKind === HighwayKind.Tertiary) {
            return 1.1;
        } else if (way.highwayKind === HighwayKind.TertiaryLink) {
            return 1.1;
        } else if (way.highwayKind === HighwayKind.Secondary) {
            return 1.1;
        } else if (way.highwayKind === HighwayKind.SecondaryLink) {
            return 1.1;
        } else if (way.highwayKind === HighwayKind.Primary) {
            return 1.1;
        } else if (way.highwayKind === HighwayKind.PrimaryLink) {
            return 1.1;
        } else if (way.highwayKind === HighwayKind.LivingStreet) {
            return 0.8;
        } else if (way.highwayKind === HighwayKind.Footway) {
            return 0.8;
        }

        return 1;
    }

    public getCost(from: RoutableTileNode, to: RoutableTileNode, way: RoutableTileWay): number {
        return this.getMultiplier(way) * this.getDuration(from, to, way);
    }

    public isObstacle(node: RoutableTileNode): boolean {
        return false;
    }
}
