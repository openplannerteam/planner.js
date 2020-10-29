"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const asynciterator_1 = require("asynciterator");
const inversify_1 = require("inversify");
const TravelMode_1 = __importDefault(require("../../enums/TravelMode"));
const EventBus_1 = __importDefault(require("../../events/EventBus"));
const EventType_1 = __importDefault(require("../../events/EventType"));
const types_1 = __importDefault(require("../../types"));
const Leg_1 = __importDefault(require("../Leg"));
const Path_1 = __importDefault(require("../Path"));
const Step_1 = __importDefault(require("../Step"));
const ProfileUtil_1 = __importDefault(require("./CSA/util/ProfileUtil"));
/**
 * Creates journeys based on the profiles and query from [[CSAProfile]].
 * A journey is an [[IPath]] that consist of several [[IStep]]s.
 *
 * @property bestArrivalTime Stores the best arrival time for each pair of departure-arrival stops.
 */
let JourneyExtractorProfile = class JourneyExtractorProfile {
    constructor(locationResolver) {
        this.bestArrivalTime = [];
        this.locationResolver = locationResolver;
        this.eventBus = EventBus_1.default.getInstance();
    }
    async extractJourneys(profilesByStop, query) {
        const filteredProfilesByStop = ProfileUtil_1.default.filterInfinity(profilesByStop);
        const departureLocation = query.from[0];
        const arrivalLocation = query.to[0];
        const paths = [];
        const departureLocationProfiles = filteredProfilesByStop[departureLocation.id];
        // Can't find departure stop;
        if (!departureLocationProfiles) {
            return new asynciterator_1.ArrayIterator(paths);
        }
        for (const profile of departureLocationProfiles) {
            for (let amountOfTransfers = 0; amountOfTransfers < profile.transferProfiles.length; amountOfTransfers++) {
                const transferProfile = profile.transferProfiles[amountOfTransfers];
                if (this.checkBestArrivalTime(transferProfile, departureLocation, arrivalLocation)) {
                    try {
                        paths.push(await this.extractJourney(departureLocation, arrivalLocation, transferProfile, amountOfTransfers, filteredProfilesByStop));
                        this.setBestArrivalTime(departureLocation, arrivalLocation, transferProfile.arrivalTime);
                    }
                    catch (e) {
                        if (this.eventBus) {
                            this.eventBus.emit(EventType_1.default.Warning, (e));
                        }
                    }
                }
            }
        }
        return new asynciterator_1.ArrayIterator(paths.reverse());
    }
    checkBestArrivalTime(transferProfile, departureLocation, arrivalLocation) {
        const canArrive = transferProfile.arrivalTime < Infinity;
        if (!canArrive) {
            return false;
        }
        const bestArrivalTimesOfDepartureStop = this.bestArrivalTime[departureLocation.id];
        if (!bestArrivalTimesOfDepartureStop) {
            return true;
        }
        const bestArrivalTime = bestArrivalTimesOfDepartureStop[arrivalLocation.id];
        if (!bestArrivalTime) {
            return true;
        }
        return transferProfile.arrivalTime < bestArrivalTime;
    }
    setBestArrivalTime(departureLocation, arrivalLocation, arrivalTime) {
        if (!this.bestArrivalTime[departureLocation.id]) {
            this.bestArrivalTime[departureLocation.id] = [];
        }
        this.bestArrivalTime[departureLocation.id][arrivalLocation.id] = arrivalTime;
    }
    async extractJourney(departureLocation, arrivalLocation, transferProfile, transfers, profilesByStop) {
        const path = Path_1.default.create();
        let currentTransferProfile = transferProfile;
        let departureTime = transferProfile.departureTime;
        let remainingTransfers = transfers;
        let currentLocation = departureLocation;
        while (remainingTransfers >= 0) {
            const enterConnection = currentTransferProfile.enterConnection;
            const exitConnection = currentTransferProfile.exitConnection;
            const enterLocation = await this.locationResolver.resolve(enterConnection.departureStop);
            const exitLocation = await this.locationResolver.resolve(exitConnection.arrivalStop);
            // Initial or transfer footpath.
            const transferDepartureTime = enterConnection.departureTime.getTime();
            if (departureTime !== transferDepartureTime) {
                let timeToSubtract = 0;
                if (path.legs.length > 0) {
                    timeToSubtract = departureTime - path.legs[path.legs.length - 1].getStopTime().getTime();
                }
                const footpath = Step_1.default.create(currentLocation, enterLocation, {
                    minimum: transferDepartureTime - departureTime,
                }, null, new Date(departureTime - timeToSubtract), new Date(transferDepartureTime - timeToSubtract));
                const footpathLeg = new Leg_1.default(TravelMode_1.default.Walking, [footpath]);
                path.appendLeg(footpathLeg);
            }
            // Public transport step.
            const step = Step_1.default.createFromConnections(enterConnection, exitConnection);
            step.startLocation = enterLocation;
            step.stopLocation = exitLocation;
            const leg = new Leg_1.default(exitConnection.travelMode, [step]);
            path.appendLeg(leg);
            currentLocation = exitLocation;
            remainingTransfers--;
            // Stop if we already arrived.
            if (path.legs[path.legs.length - 1].getStopLocation().id === arrivalLocation.id) {
                break;
            }
            // Get next profile based on the arrival time at the current location.
            if (remainingTransfers >= 0) {
                const currentProfiles = profilesByStop[currentLocation.id];
                let profileIndex = currentProfiles.length - 1;
                currentTransferProfile = currentProfiles[profileIndex].transferProfiles[remainingTransfers];
                departureTime = currentTransferProfile.departureTime;
                while (profileIndex >= 0 && departureTime < exitConnection.arrivalTime.getTime()) {
                    currentTransferProfile = currentProfiles[--profileIndex].transferProfiles[remainingTransfers];
                    departureTime = currentTransferProfile.departureTime;
                }
                if (profileIndex === -1) {
                    // This should never happen.
                    return Promise.reject("Can't find next connection");
                }
            }
            // Final footpath.
            if (remainingTransfers === -1) {
                const transferArrivalTime = exitConnection.arrivalTime;
                const arrivalTime = new Date(currentTransferProfile.arrivalTime);
                if (arrivalTime.getTime() !== transferArrivalTime.getTime()) {
                    const footpath = Step_1.default.create(currentLocation, arrivalLocation, {
                        minimum: arrivalTime.getTime() - transferArrivalTime.getTime(),
                    }, null, transferArrivalTime, arrivalTime);
                    const footpathLeg = new Leg_1.default(TravelMode_1.default.Walking, [footpath]);
                    path.appendLeg(footpathLeg);
                }
            }
        }
        // Check if path ends in the arrival location.
        if (path.legs[path.legs.length - 1].getStopLocation().id !== arrivalLocation.id) {
            // This should never happen.
            return Promise.reject("Can't reach arrival stop:");
        }
        return path;
    }
};
JourneyExtractorProfile = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(types_1.default.LocationResolver)),
    __metadata("design:paramtypes", [Object])
], JourneyExtractorProfile);
exports.default = JourneyExtractorProfile;
//# sourceMappingURL=JourneyExtractorProfile.js.map