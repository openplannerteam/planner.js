"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DynamicProfile_1 = __importDefault(require("./DynamicProfile"));
class CharacteristicProfile extends DynamicProfile_1.default {
    constructor(url) {
        super(url);
        this.accessCache = {};
        this.onewayCache = {};
        this.speedCache = {};
        this.priorityCache = {};
        this.id = url;
    }
    static create(url) {
        return new CharacteristicProfile(url);
    }
    getID() {
        return this.id;
    }
    isOneWay(way) {
        const characteristic = this.getWayCharacteristic(way);
        if (this.onewayCache[characteristic] !== undefined) {
            return this.onewayCache[characteristic];
        }
        const result = super.isOneWay(way);
        this.onewayCache[characteristic] = result;
        return result;
    }
    hasAccess(way) {
        const characteristic = this.getWayCharacteristic(way);
        if (this.accessCache[characteristic] !== undefined) {
            return this.accessCache[characteristic];
        }
        const result = super.hasAccess(way);
        this.accessCache[characteristic] = result;
        return result;
    }
    getSpeed(way) {
        const characteristic = this.getWayCharacteristic(way);
        if (this.speedCache[characteristic] !== undefined) {
            return this.speedCache[characteristic];
        }
        const result = super.getSpeed(way);
        this.speedCache[characteristic] = result;
        return result;
    }
    getMultiplier(way) {
        const characteristic = this.getWayCharacteristic(way);
        if (this.priorityCache[characteristic] !== undefined) {
            return this.priorityCache[characteristic];
        }
        const result = super.getMultiplier(way);
        this.priorityCache[characteristic] = result;
        return result;
    }
    getWayCharacteristic(way) {
        return way.reachable + Object.values(way.definedTags).join();
    }
}
exports.default = CharacteristicProfile;
//# sourceMappingURL=CharacteresticProfile.js.map