"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Geo_1 = __importDefault(require("../../util/Geo"));
const Profile_1 = __importDefault(require("./Profile"));
class DynamicProfile extends Profile_1.default {
    constructor(url) {
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
    static create(url) {
        return new DynamicProfile(url);
    }
    getID() {
        return this.id;
    }
    isOneWay(way) {
        // todo, reversed order
        for (const rule of this.onewayRules) {
            if (rule.conclusion.isOneway !== undefined) {
                // should always be the case, but just in case
                if (rule.condition !== undefined) {
                    if (way.definedTags[rule.condition.predicate] === rule.condition.object) {
                        return rule.conclusion.isOneway;
                    }
                }
                else {
                    return rule.conclusion.isOneway;
                }
            }
        }
    }
    hasAccess(way) {
        for (const rule of this.accessRules) {
            if (rule.conclusion.hasAccess !== undefined) {
                // should always be the case, but just in case
                if (rule.condition !== undefined) {
                    if (way.definedTags[rule.condition.predicate] === rule.condition.object) {
                        return rule.conclusion.hasAccess;
                    }
                }
                else {
                    return rule.conclusion.hasAccess;
                }
            }
        }
    }
    getDefaultSpeed() {
        return 5;
    }
    getMaxSpeed() {
        return this.maxSpeed || 300;
    }
    getSpeed(way) {
        const speedLimit = Math.min(way.maxSpeed || Infinity, this.getMaxSpeed());
        for (const rule of this.speedRules) {
            if (rule.conclusion.speed !== undefined) {
                // should always be the case, but just in case
                if (rule.condition !== undefined) {
                    if (way.definedTags[rule.condition.predicate] === rule.condition.object) {
                        if (typeof (rule.conclusion.speed) === "number") {
                            return Math.min(rule.conclusion.speed, speedLimit);
                        }
                    }
                    else {
                        if (typeof (rule.conclusion.speed) === "number") {
                            return Math.min(rule.conclusion.speed, speedLimit);
                        }
                    }
                }
            }
        }
        return Math.min(speedLimit, this.getDefaultSpeed());
    }
    getDistance(from, to, way) {
        return Geo_1.default.getDistanceBetweenLocations(from, to);
    }
    getDuration(from, to, way) {
        const distance = this.getDistance(from, to, way) / 1000; // km
        const speed = this.getSpeed(way);
        const time = distance / speed; // h
        return time * 60 * 60 * 1000; // ms
    }
    getMultiplier(way) {
        for (const rule of this.priorityRules) {
            if (rule.conclusion.priority !== undefined) {
                // should always be the case, but just in case
                if (rule.condition !== undefined) {
                    if (way.definedTags[rule.condition.predicate] === rule.condition.object) {
                        return 1 - (rule.conclusion.priority - 1);
                    }
                }
                else {
                    return 1 - (rule.conclusion.priority - 1);
                }
            }
        }
    }
    getCost(from, to, way) {
        const toWeight = this.getNodeWeight(to);
        const fromWeight = this.getNodeWeight(from);
        const weight = Math.max(toWeight, fromWeight);
        return weight * this.getMultiplier(way) * (this.getDuration(from, to, way) + this.getObstacleTime(to));
    }
    getNodeWeight(node) {
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
    isObstacle(node) {
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
                }
                else {
                    return rule.conclusion.isObstacle;
                }
            }
        }
    }
    getObstacleTime(node) {
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
                }
                else {
                    return rule.conclusion.obstacleTime * 1000;
                }
            }
        }
        return 0;
    }
}
exports.default = DynamicProfile;
//# sourceMappingURL=DynamicProfile.js.map