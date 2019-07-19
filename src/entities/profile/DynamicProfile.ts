import Highway from "../../enums/Highway";
import getOsmTagMapping from "../../enums/OSMTags";
import { DistanceM, DurationMs } from "../../interfaces/units";
import { PROFILE } from "../../uri/constants";
import URI from "../../uri/uri";
import Geo from "../../util/Geo";
import { RoutableTileNode } from "../tiles/node";
import { RoutableTileWay } from "../tiles/way";
import Profile from "./Profile";
import ProfileRule from "./ProfileRule";

export default class DynamicProfile extends Profile {
    public static create(url: string): DynamicProfile {
        return new DynamicProfile(url);
    }

    public id: string;
    public accessRules: ProfileRule[];
    public onewayRules: ProfileRule[];
    public speedRules: ProfileRule[];
    public priorityRules: ProfileRule[];
    public obstacleRules: ProfileRule[];

    public maxSpeed: number;
    public usePublicTransport: boolean;

    private mapping;

    constructor(url: string) {
        super();
        this.id = url;
        this.mapping = getOsmTagMapping();
    }

    public getID(): string {
        return this.id;
    }

    public isOneWay(way: RoutableTileWay): boolean {
        // todo, reversed order
        for (const rule of this.onewayRules) {
            if (rule.conclusion.isOneway !== undefined) {
                // should always be the case, but just in case
                if (rule.condition !== undefined) {
                    const field = this.mapping[rule.condition.predicate];
                    if (way[field] === rule.condition.object) {
                        return rule.conclusion.isOneway;
                    }
                } else {
                    return rule.conclusion.isOneway;
                }
            }
        }
    }

    public hasAccess(way: RoutableTileWay): boolean {
        for (const rule of this.accessRules) {
            if (rule.conclusion.hasAccess !== undefined) {
                // should always be the case, but just in case
                if (rule.condition !== undefined) {
                    const field = this.mapping[rule.condition.predicate];
                    if (way[field] === rule.condition.object) {
                        return rule.conclusion.hasAccess;
                    }
                } else {
                    return rule.conclusion.hasAccess;
                }
            }
        }
    }

    public getDefaultSpeed() {
        return 5;
    }

    public getMaxSpeed(): number {
        return this.maxSpeed || 300;
    }

    public getSpeed(way: RoutableTileWay): number {
        const speedLimit = Math.min(way.maxSpeed || Infinity, this.getMaxSpeed());

        for (const rule of this.speedRules) {
            if (rule.conclusion.speed !== undefined) {
                // should always be the case, but just in case
                if (rule.condition !== undefined) {
                    const field = this.mapping[rule.condition.predicate];
                    if (way[field] === rule.condition.object) {
                        if (typeof (rule.conclusion.speed) === "number") {
                            return Math.min(rule.conclusion.speed, speedLimit);
                        }
                    } else {
                        if (typeof (rule.conclusion.speed) === "number") {
                            return Math.min(rule.conclusion.speed, speedLimit);
                        }
                    }
                }
            }
        }

        return Math.min(speedLimit, this.getDefaultSpeed());
    }

    public getDistance(from: RoutableTileNode, to: RoutableTileNode, way: RoutableTileWay): DistanceM {
        return Geo.getDistanceBetweenLocations(from, to);
    }

    public getDuration(from: RoutableTileNode, to: RoutableTileNode, way: RoutableTileWay): DurationMs {
        const distance = this.getDistance(from, to, way) / 1000; // km
        const speed = this.getSpeed(way);
        const time = distance / speed; // h
        return time * 60 * 60 * 1000; // ms
    }

    public getMultiplier(way: RoutableTileWay): number {
        for (const rule of this.priorityRules) {
            if (rule.conclusion.priority !== undefined) {
                // should always be the case, but just in case
                if (rule.condition !== undefined) {
                    const field = this.mapping[rule.condition.predicate];
                    if (way[field] === rule.condition.object) {
                        return 1 - (rule.conclusion.priority - 1);
                    }
                } else {
                    return 1 - (rule.conclusion.priority - 1);
                }
            }
        }
    }

    public getCost(from: RoutableTileNode, to: RoutableTileNode, way: RoutableTileWay): number {
        return this.getMultiplier(way) * this.getDuration(from, to, way);
    }

    public isObstacle(node: RoutableTileNode): boolean {
        for (const rule of this.accessRules) {
            if (rule.conclusion.isObstacle !== undefined) {
                // should always be the case, but just in case
                if (rule.condition !== undefined) {
                    const field = this.mapping[rule.condition.predicate];
                    if (node[field] === rule.condition.object) {
                        return rule.conclusion.isObstacle;
                    }
                } else {
                    return rule.conclusion.isObstacle;
                }
            }
        }
    }
}
