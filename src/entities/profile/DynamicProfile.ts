import { DistanceM, DurationMs } from "../../interfaces/units";
import Geo from "../../util/Geo";
import { RoutableTileNode } from "../tiles/RoutableTileNode";
import { RoutableTileWay } from "../tiles/RoutableTileWay";
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
    public obstacleTimeRules: ProfileRule[];
    public proximityRules: ProfileRule[];

    public maxSpeed: number;
    public usePublicTransport: boolean;

    constructor(url: string) {
        super();
        this.id = url;

        this.accessRules = [];
        this.onewayRules = [];
        this.speedRules = [];
        this.priorityRules = [];
        this.obstacleRules = [];
        this.obstacleTimeRules = [];
        this.proximityRules = [];

        this.maxSpeed = 10;
        this.usePublicTransport = true;
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
                    if (way.definedTags[rule.condition.predicate] === rule.condition.object) {
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
                    if (way.definedTags[rule.condition.predicate] === rule.condition.object) {
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
                    if (way.definedTags[rule.condition.predicate] === rule.condition.object) {
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
                    if (way.definedTags[rule.condition.predicate] === rule.condition.object) {
                        return 1 - (rule.conclusion.priority - 1);
                    }
                } else {
                    return 1 - (rule.conclusion.priority - 1);
                }
            }
        }
    }

    public getCost(from: RoutableTileNode, to: RoutableTileNode, way: RoutableTileWay): number {
        const toWeight = this.getNodeWeight(to);
        const fromWeight = this.getNodeWeight(from);
        const weight = Math.max(toWeight, fromWeight);
        return weight * this.getMultiplier(way) * (this.getDuration(from, to, way) + this.getObstacleTime(to));
    }

    public getNodeWeight(node: RoutableTileNode) {
        let count = 1;
        let acc = 1;

        if (node.proximity) {
            for (const rule of this.proximityRules) {
                if (rule.conclusion.priority !== undefined) {
                    // should always be the case, but just in case
                    if (rule.condition !== undefined) {
                        if (node.proximity[rule.condition.object]) {
                            const penalty = rule.conclusion.priority;
                            count += node.proximity[rule.condition.object];
                            acc += penalty * node.proximity[rule.condition.object];
                        }
                    }
                }
            }
        }

        return 1 / ((acc * acc) / (count * count));
    }

    public isObstacle(node: RoutableTileNode): boolean {
        if (!node.definedTags) {
            // not a real OSM node, we're probably embedding a location onto the network
            return false;
        }

        for (const rule of this.obstacleRules) {
            if (rule.conclusion.isObstacle !== undefined) {
                // should always be the case, but just in case
                if (rule.condition !== undefined) {
                    if (node.definedTags[rule.condition.predicate] === rule.condition.object) {
                        return rule.conclusion.isObstacle;
                    }
                } else {
                    return rule.conclusion.isObstacle;
                }
            }
        }
    }

    public getObstacleTime(node: RoutableTileNode): DurationMs {
        if (!node.definedTags) {
            // not a real OSM node, we're probably embedding a location onto the network
            return 0;
        }

        for (const rule of this.obstacleTimeRules) {
            if (rule.conclusion.obstacleTime !== undefined) {
                // should always be the case, but just in case
                if (rule.condition !== undefined) {
                    const field = rule.condition.predicate;
                    if (node.definedTags[field] && rule.condition.object === undefined) {
                        return rule.conclusion.obstacleTime * 1000;
                    }
                    if (node.definedTags[field] === rule.condition.object && rule.condition.object !== undefined) {
                        return rule.conclusion.obstacleTime * 1000;
                    }

                } else {
                    return rule.conclusion.obstacleTime * 1000;
                }
            }
        }

        return 0;
    }
}
