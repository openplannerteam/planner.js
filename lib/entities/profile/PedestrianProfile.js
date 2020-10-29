"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Highway_1 = __importDefault(require("../../enums/Highway"));
const Geo_1 = __importDefault(require("../../util/Geo"));
const Profile_1 = __importDefault(require("./Profile"));
class PedestrianProfile extends Profile_1.default {
    getID() {
        return "PEDESTRIAN";
    }
    isOneWay(way) {
        return false;
    }
    hasAccess(way) {
        if (way.highwayKind === Highway_1.default.Motorway) {
            return false;
        }
        else if (way.highwayKind === Highway_1.default.MotorwayLink) {
            return false;
        }
        else if (way.highwayKind === Highway_1.default.Trunk) {
            return false;
        }
        else if (way.highwayKind === Highway_1.default.TrunkLink) {
            return false;
        }
        return true;
    }
    getDefaultSpeed() {
        return 5;
    }
    getMaxSpeed() {
        return this.getDefaultSpeed();
    }
    getSpeed(way) {
        return this.getDefaultSpeed();
    }
    getDistance(from, to, way) {
        return Geo_1.default.getDistanceBetweenLocations(from, to);
    }
    getDuration(from, to, way) {
        const distance = this.getDistance(from, to, way) / 1000; // km
        const speed = 5; // km/h
        const time = distance / speed; // h
        return time * 60 * 60 * 1000; // ms
    }
    getMultiplier(way) {
        if (way.highwayKind === Highway_1.default.Motorway) {
            return 1.3;
        }
        else if (way.highwayKind === Highway_1.default.MotorwayLink) {
            return 1.3;
        }
        else if (way.highwayKind === Highway_1.default.Trunk) {
            return 1.3;
        }
        else if (way.highwayKind === Highway_1.default.TrunkLink) {
            return 1.3;
        }
        else if (way.highwayKind === Highway_1.default.Service) {
            return 1.1;
        }
        else if (way.highwayKind === Highway_1.default.Tertiary) {
            return 1.1;
        }
        else if (way.highwayKind === Highway_1.default.TertiaryLink) {
            return 1.1;
        }
        else if (way.highwayKind === Highway_1.default.Secondary) {
            return 1.1;
        }
        else if (way.highwayKind === Highway_1.default.SecondaryLink) {
            return 1.1;
        }
        else if (way.highwayKind === Highway_1.default.Primary) {
            return 1.1;
        }
        else if (way.highwayKind === Highway_1.default.PrimaryLink) {
            return 1.1;
        }
        else if (way.highwayKind === Highway_1.default.LivingStreet) {
            return 0.8;
        }
        else if (way.highwayKind === Highway_1.default.Footway) {
            return 0.8;
        }
        return 1;
    }
    getCost(from, to, way) {
        return this.getMultiplier(way) * this.getDuration(from, to, way);
    }
    isObstacle(node) {
        return false;
    }
    getObstacleTime(node) {
        return 0;
    }
}
exports.default = PedestrianProfile;
//# sourceMappingURL=PedestrianProfile.js.map