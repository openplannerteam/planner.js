import { RoutableTileNode } from "../entities/tiles/node";
import { RoutableTileWay } from "../entities/tiles/way";
import Highway from "../enums/Highway";
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
        if (way.highwayKind === Highway.Motorway) {
            return false;
        } else if (way.highwayKind === Highway.MotorwayLink) {
            return false;
        } else if (way.highwayKind === Highway.Trunk) {
            return false;
        } else if (way.highwayKind === Highway.TrunkLink) {
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
        if (way.highwayKind === Highway.Motorway) {
            return 1.3;
        } else if (way.highwayKind === Highway.MotorwayLink) {
            return 1.3;
        } else if (way.highwayKind === Highway.Trunk) {
            return 1.3;
        } else if (way.highwayKind === Highway.TrunkLink) {
            return 1.3;
        } else if (way.highwayKind === Highway.Service) {
            return 1.1;
        } else if (way.highwayKind === Highway.Tertiary) {
            return 1.1;
        } else if (way.highwayKind === Highway.TertiaryLink) {
            return 1.1;
        } else if (way.highwayKind === Highway.Secondary) {
            return 1.1;
        } else if (way.highwayKind === Highway.SecondaryLink) {
            return 1.1;
        } else if (way.highwayKind === Highway.Primary) {
            return 1.1;
        } else if (way.highwayKind === Highway.PrimaryLink) {
            return 1.1;
        } else if (way.highwayKind === Highway.LivingStreet) {
            return 0.8;
        } else if (way.highwayKind === Highway.Footway) {
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
