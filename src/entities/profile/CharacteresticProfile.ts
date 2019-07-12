import getOsmTagMapping from "../../enums/OSMTags";
import { RoutableTileNode } from "../tiles/node";
import { RoutableTileWay } from "../tiles/way";
import DynamicProfile from "./DynamicProfile";

export default class CharacteristicProfile extends DynamicProfile {
    public static create(url: string): CharacteristicProfile {
        return new CharacteristicProfile(url);
    }

    private accessCache: object;
    private onewayCache: object;
    private speedCache: object;
    private priorityCache: object;

    constructor(url: string) {
        super(url);
        this.accessCache = {};
        this.onewayCache = {};
        this.speedCache = {};
        this.priorityCache = {};
        this.id = url;
    }

    public getID(): string {
        return this.id;
    }

    public isOneWay(way: RoutableTileWay): boolean {
        const characteristic = this.getWayCharacteristic(way);
        if (this.onewayCache[characteristic] !== undefined) {
            return this.onewayCache[characteristic];
        }

        const result = super.isOneWay(way);
        this.onewayCache[characteristic] = result;
        return result;
    }

    public hasAccess(way: RoutableTileWay): boolean {
        const characteristic = this.getWayCharacteristic(way);
        if (this.accessCache[characteristic] !== undefined) {
            return this.accessCache[characteristic];
        }

        const result = super.hasAccess(way);
        this.accessCache[characteristic] = result;
        return result;
    }

    public getSpeed(way: RoutableTileWay): number {
        const characteristic = this.getWayCharacteristic(way);
        if (this.speedCache[characteristic] !== undefined) {
            return this.speedCache[characteristic];
        }

        const result = super.getSpeed(way);
        this.speedCache[characteristic] = result;
        return result;
    }

    public getMultiplier(way: RoutableTileWay): number {
        const characteristic = this.getWayCharacteristic(way);
        if (this.priorityCache[characteristic] !== undefined) {
            return this.priorityCache[characteristic];
        }

        const result = super.getMultiplier(way);
        this.priorityCache[characteristic] = result;
        return result;
    }

    public isObstacle(node: RoutableTileNode): boolean {
        for (const rule of this.accessRules) {
            if (rule.conclusion.isObstacle !== undefined) {
                // should always be the case, but just in case
                if (rule.condition !== undefined) {
                    const field = getOsmTagMapping()[rule.condition.predicate];
                    if (node[field] === rule.condition.object) {
                        return rule.conclusion.isObstacle;
                    }
                } else {
                    return rule.conclusion.isObstacle;
                }
            }
        }
    }

    private getWayCharacteristic(way: RoutableTileWay) {
        return way.reachable +
            way.accessRestrictions +
            way.bicycleAccessRestrictions +
            way.constructionKind +
            way.crossingKind +
            way.cyclewayKind +
            way.footwayKind +
            way.highwayKind +
            way.maxSpeed +
            way.motorVehicleAccessRestrictions +
            way.motorcarAccessRestrictions +
            way.onewayBicycleKind +
            way.onewayKind +
            way.smoothnessKind +
            way.surfaceKind +
            way.trackType +
            way.vehicleAccessRestrictions;
    }
}
