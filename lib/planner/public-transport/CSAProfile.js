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
const DropOffType_1 = __importDefault(require("../../enums/DropOffType"));
const PickupType_1 = __importDefault(require("../../enums/PickupType"));
const ReachableStopsFinderMode_1 = __importDefault(require("../../enums/ReachableStopsFinderMode"));
const ReachableStopsSearchPhase_1 = __importDefault(require("../../enums/ReachableStopsSearchPhase"));
const TravelMode_1 = __importDefault(require("../../enums/TravelMode"));
const EventBus_1 = __importDefault(require("../../events/EventBus"));
const EventType_1 = __importDefault(require("../../events/EventType"));
const ConnectionSelectors_1 = require("../../fetcher/connections/ConnectionSelectors");
const types_1 = __importDefault(require("../../types"));
const Geo_1 = __importDefault(require("../../util/Geo"));
const MergeIterator_1 = __importDefault(require("../../util/iterators/MergeIterator"));
const Vectors_1 = __importDefault(require("../../util/Vectors"));
const Profile_1 = __importDefault(require("./CSA/data-structure/stops/Profile"));
const EarliestArrivalByTransfers_1 = __importDefault(require("./CSA/data-structure/trips/EarliestArrivalByTransfers"));
const FootpathQueue_1 = __importDefault(require("./CSA/FootpathQueue"));
const ProfileUtil_1 = __importDefault(require("./CSA/util/ProfileUtil"));
/**
 * An implementation of the Profile Connection Scan Algorithm.
 * The profile connection scan algorithm takes the amount of transfers and initial, transfer and final footpaths
 * into account.
 *
 * @implements [[IPublicTransportPlanner]]
 * @property profilesByStop Describes the CSA profiles for each scanned stop.
 * @property earliestArrivalByTrip Describes the earliest arrival time for each scanned trip.
 * @property durationToTargetByStop Describes the walking duration to the target stop for a scanned stop.
 * @property gtfsTripByConnection Stores the tripIDs a connection is part of. Used for splitting and joining.
 *
 * @returns multiple [[IPath]]s that consist of several [[IStep]]s.
 */
let CSAProfile = class CSAProfile {
    constructor(connectionsProvider, locationResolver, initialReachableStopsFinder, transferReachableStopsFinder, finalReachableStopsFinder, journeyExtractor) {
        this.connectionsProvider = connectionsProvider;
        this.locationResolver = locationResolver;
        this.initialReachableStopsFinder = initialReachableStopsFinder;
        this.transferReachableStopsFinder = transferReachableStopsFinder;
        this.finalReachableStopsFinder = finalReachableStopsFinder;
        this.journeyExtractor = journeyExtractor;
        this.eventBus = EventBus_1.default.getInstance();
    }
    async plan(query) {
        const { minimumDepartureTime: lowerBoundDate, maximumArrivalTime: upperBoundDate, } = query;
        const footpathQueue = new FootpathQueue_1.default(true);
        const connectionsIterator = await this.connectionsProvider.createIterator({
            backward: true,
            upperBoundDate,
            lowerBoundDate,
            excludedModes: query.excludedTravelModes,
            region: null,
        });
        const mergedIterator = new MergeIterator_1.default([connectionsIterator, footpathQueue], ConnectionSelectors_1.backwardsConnectionsSelector, true);
        const queryState = {
            query,
            profilesByStop: {},
            earliestArrivalByTrip: {},
            durationToTargetByStop: {},
            gtfsTripByConnection: {},
            initialReachableStops: [],
            footpathQueue,
            connectionsIterator: mergedIterator,
        };
        const hasInitialReachableStops = await this.initDurationToTargetByStop(queryState);
        const hasFinalReachableStops = await this.initInitialReachableStops(queryState);
        if (!hasInitialReachableStops || !hasFinalReachableStops) {
            return Promise.resolve(new asynciterator_1.ArrayIterator([]));
        }
        const self = this;
        return new Promise((resolve, reject) => {
            let isDone = false;
            const done = () => {
                if (!isDone) {
                    queryState.connectionsIterator.close();
                    self.journeyExtractor.extractJourneys(queryState.profilesByStop, queryState.query)
                        .then((resultIterator) => {
                        resolve(resultIterator);
                    });
                    isDone = true;
                }
            };
            queryState.connectionsIterator.on("readable", () => self.processNextConnection(queryState, done));
            connectionsIterator.on("end", () => done());
            self.processNextConnection(queryState, done);
        });
    }
    async processNextConnection(queryState, done) {
        let connection = queryState.connectionsIterator.read();
        while (connection) {
            if (connection.departureTime < queryState.query.minimumDepartureTime) {
                queryState.connectionsIterator.close();
                done();
                break;
            }
            if (connection.arrivalTime > queryState.query.maximumArrivalTime && !queryState.connectionsIterator.closed) {
                connection = queryState.connectionsIterator.read();
                continue;
            }
            if (this.eventBus) {
                this.eventBus.emit(EventType_1.default.ConnectionScan, connection);
            }
            this.discoverConnection(queryState, connection);
            const earliestArrivalTime = this.calculateEarliestArrivalTime(queryState, connection);
            this.updateEarliestArrivalByTrip(queryState, connection, earliestArrivalTime);
            if (!this.isDominated(queryState, connection, earliestArrivalTime) &&
                this.hasValidRoute(queryState, earliestArrivalTime, connection.departureTime.getTime())) {
                await this.getFootpathsForDepartureStop(queryState, connection, earliestArrivalTime);
            }
            if (!queryState.connectionsIterator.closed) {
                connection = queryState.connectionsIterator.read();
                continue;
            }
            connection = undefined;
        }
    }
    hasValidRoute(queryState, arrivalTimeByTransfers, departureTime) {
        if (!queryState.query.maximumTravelDuration) {
            return true;
        }
        for (const arrival of arrivalTimeByTransfers) {
            const isValid = arrival.arrivalTime - departureTime <= queryState.query.maximumTravelDuration;
            if (isValid) {
                return true;
            }
        }
        return false;
    }
    discoverConnection(queryState, connection) {
        queryState.gtfsTripByConnection[connection.id] = connection.tripId;
        if (!queryState.profilesByStop[connection.departureStop]) {
            queryState.profilesByStop[connection.departureStop] = [Profile_1.default.create(queryState.query.maximumTransfers)];
        }
        if (!queryState.profilesByStop[connection.arrivalStop]) {
            queryState.profilesByStop[connection.arrivalStop] = [Profile_1.default.create(queryState.query.maximumTransfers)];
        }
        if (!queryState.earliestArrivalByTrip[connection.tripId]) {
            queryState.earliestArrivalByTrip[connection.tripId] = EarliestArrivalByTransfers_1.default.create(queryState.query.maximumTransfers);
        }
    }
    getTripIdsFromConnection(queryState, connection) {
        const tripIds = [connection.tripId];
        return tripIds;
        /*
        // nextConnection isn't useable yet
        if (!connection.nextConnection) {
          return tripIds;
        }
    
        for (const connectionId of connection.nextConnection) {
          const tripId: string = queryState.gtfsTripByConnection[connectionId];
    
          if (tripIds.indexOf(tripId) === -1 && tripId) {
            tripIds.push(tripId);
          }
        }
    
        return tripIds;
        */
    }
    calculateEarliestArrivalTime(queryState, connection) {
        const remainSeatedTime = this.remainSeated(queryState, connection);
        if (connection.dropOffType === DropOffType_1.default.NotAvailable) {
            return remainSeatedTime;
        }
        const walkToTargetTime = this.walkToTarget(queryState, connection);
        const takeTransferTime = this.takeTransfer(queryState, connection);
        return Vectors_1.default.minVector((c) => c.arrivalTime, walkToTargetTime, remainSeatedTime, takeTransferTime);
    }
    async initDurationToTargetByStop(queryState) {
        const arrivalStop = queryState.query.to[0];
        const geoId = Geo_1.default.getId(queryState.query.to[0]);
        if (!queryState.query.to[0].id) {
            queryState.query.to[0].id = geoId;
            queryState.query.to[0].name = "Arrival location";
        }
        const reachableStops = await this.finalReachableStopsFinder
            .findReachableStops(arrivalStop, ReachableStopsFinderMode_1.default.Target, queryState.query.maximumWalkingDuration, queryState.query.minimumWalkingSpeed, queryState.query.profileID);
        if (reachableStops.length < 1) {
            if (this.eventBus) {
                this.eventBus.emit(EventType_1.default.AbortQuery, "No reachable stops at arrival location");
            }
            return false;
        }
        if (this.eventBus) {
            this.eventBus.emit(EventType_1.default.FinalReachableStops, reachableStops);
        }
        for (const reachableStop of reachableStops) {
            if (reachableStop.duration === 0) {
                queryState.query.to[0] = reachableStop.stop; // fixme: why is this here?
            }
            queryState.durationToTargetByStop[reachableStop.stop.id] = reachableStop.duration;
        }
        return true;
    }
    async initInitialReachableStops(queryState) {
        const fromLocation = queryState.query.from[0];
        const geoId = Geo_1.default.getId(queryState.query.from[0]);
        if (!queryState.query.from[0].id) {
            queryState.query.from[0].id = geoId;
            queryState.query.from[0].name = "Departure location";
        }
        queryState.initialReachableStops = await this.initialReachableStopsFinder.findReachableStops(fromLocation, ReachableStopsFinderMode_1.default.Source, queryState.query.maximumWalkingDuration, queryState.query.minimumWalkingSpeed, queryState.query.profileID);
        for (const reachableStop of queryState.initialReachableStops) {
            if (reachableStop.duration === 0) {
                // this.query.from[0] = reachableStop.stop; // wat
            }
        }
        if (queryState.initialReachableStops.length < 1) {
            if (this.eventBus) {
                this.eventBus.emit(EventType_1.default.AbortQuery, "No reachable stops at departure location");
            }
            return false;
        }
        if (this.eventBus) {
            this.eventBus.emit(EventType_1.default.InitialReachableStops, queryState.initialReachableStops);
        }
        return true;
    }
    walkToTarget(queryState, connection) {
        const walkingTimeToTarget = queryState.durationToTargetByStop[connection.arrivalStop];
        if (walkingTimeToTarget === undefined || connection.dropOffType === DropOffType_1.default.NotAvailable ||
            connection.arrivalTime.getTime() + walkingTimeToTarget > queryState.query.maximumArrivalTime.getTime()) {
            return Array(queryState.query.maximumTransfers + 1).fill({
                arrivalTime: Infinity,
                tripId: connection.tripId,
            });
        }
        return Array(queryState.query.maximumTransfers + 1).fill({
            arrivalTime: connection.arrivalTime.getTime() + walkingTimeToTarget,
            tripId: connection.tripId,
        });
    }
    remainSeated(queryState, connection) {
        const tripIds = this.getTripIdsFromConnection(queryState, connection);
        const earliestArrivalTimeByTransfers = [];
        for (let amountOfTransfers = 0; amountOfTransfers < queryState.query.maximumTransfers + 1; amountOfTransfers++) {
            const earliestArrivalTime = earliestArrivalTimeByTransfers[amountOfTransfers];
            let minimumArrivalTime = earliestArrivalTime && earliestArrivalTime.arrivalTime;
            for (const tripId of tripIds) {
                const tripArrivalTime = queryState.earliestArrivalByTrip[tripId][amountOfTransfers].arrivalTime;
                if (!minimumArrivalTime || tripArrivalTime < minimumArrivalTime) {
                    earliestArrivalTimeByTransfers[amountOfTransfers] = {
                        arrivalTime: tripArrivalTime,
                        tripId,
                    };
                    minimumArrivalTime = tripArrivalTime;
                }
            }
        }
        return earliestArrivalTimeByTransfers;
    }
    takeTransfer(queryState, connection) {
        const transferTimes = ProfileUtil_1.default.getTransferTimes(queryState.profilesByStop, connection, queryState.query.maximumTransfers, queryState.query.minimumTransferDuration, queryState.query.maximumTransferDuration);
        if (connection.travelMode !== TravelMode_1.default.Walking) {
            // still part of the previous transfer
            return Vectors_1.default.shiftVector(transferTimes, { arrivalTime: Infinity, tripId: connection.tripId });
        }
        else {
            return transferTimes;
        }
    }
    updateEarliestArrivalByTrip(queryState, connection, arrivalTimeByTransfers) {
        const tripIds = this.getTripIdsFromConnection(queryState, connection);
        const earliestArrivalByTransfers = arrivalTimeByTransfers.map((arrivalTime, amountOfTransfers) => {
            const tripId = arrivalTime.tripId;
            return queryState.earliestArrivalByTrip[tripId][amountOfTransfers];
        });
        for (const tripId of tripIds) {
            queryState.earliestArrivalByTrip[tripId] = EarliestArrivalByTransfers_1.default.createByConnection(earliestArrivalByTransfers, connection, arrivalTimeByTransfers);
        }
    }
    isDominated(queryState, connection, arrivalTimeByTransfers) {
        const departureProfile = queryState.profilesByStop[connection.departureStop];
        const earliestProfileEntry = departureProfile[departureProfile.length - 1];
        return earliestProfileEntry.isDominated(arrivalTimeByTransfers, connection.departureTime.getTime());
    }
    async getFootpathsForDepartureStop(queryState, connection, currentArrivalTimeByTransfers) {
        const departureLocation = queryState.query.from[0];
        const depProfile = queryState.profilesByStop[connection.departureStop];
        const earliestProfileEntry = depProfile[depProfile.length - 1];
        const earliestArrivalTimeByTransfers = Vectors_1.default.minVector((c) => c.arrivalTime, currentArrivalTimeByTransfers, earliestProfileEntry.getArrivalTimeByTransfers());
        const initialReachableStop = queryState.initialReachableStops.find((reachable) => reachable.stop.id === connection.departureStop);
        if (initialReachableStop) {
            this.incorporateInProfile(queryState, connection, initialReachableStop.duration, departureLocation, earliestArrivalTimeByTransfers);
        }
        try {
            const departureStop = await this.locationResolver.resolve(connection.departureStop);
            const reachableStops = await this.transferReachableStopsFinder.findReachableStops(departureStop, ReachableStopsFinderMode_1.default.Target, queryState.query.maximumTransferDuration, queryState.query.minimumWalkingSpeed, queryState.query.profileID);
            const changed = this.incorporateInProfile(queryState, connection, 0, departureStop, earliestArrivalTimeByTransfers);
            if (changed) {
                for (const reachableStop of reachableStops) {
                    const { stop: stop, duration: duration } = reachableStop;
                    if (duration && stop.id) {
                        const newDepartureTime = new Date(connection.departureTime.getTime() - duration);
                        if (newDepartureTime >= queryState.query.minimumDepartureTime) {
                            // create a connection that resembles a footpath
                            // TODO, ditch the IReachbleStop and IConnection interfaces and make these proper objects
                            const transferConnection = {
                                id: `TRANSFER_TO:${stop.id}`,
                                tripId: `TRANSFER_TO:${stop.id}`,
                                travelMode: TravelMode_1.default.Walking,
                                departureTime: newDepartureTime,
                                departureStop: stop.id,
                                arrivalTime: connection.departureTime,
                                arrivalStop: connection.departureStop,
                                dropOffType: DropOffType_1.default.Regular,
                                pickupType: PickupType_1.default.Regular,
                                headsign: stop.id,
                            };
                            queryState.footpathQueue.write(transferConnection);
                        }
                    }
                }
            }
        }
        catch (e) {
            if (this.eventBus) {
                this.eventBus.emit(EventType_1.default.Warning, (e));
            }
        }
    }
    async emitTransferProfile(transferProfile, amountOfTransfers) {
        try {
            const departureStop = await this.locationResolver.resolve(transferProfile.enterConnection.departureStop);
            const arrivalStop = await this.locationResolver.resolve(transferProfile.exitConnection.arrivalStop);
            this.eventBus.emit(EventType_1.default.AddedNewTransferProfile, {
                departureStop,
                arrivalStop,
                amountOfTransfers,
            });
        }
        catch (e) {
            this.eventBus.emit(EventType_1.default.Warning, (e));
        }
    }
    incorporateInProfile(queryState, connection, duration, stop, arrivalTimeByTransfers) {
        const departureTime = connection.departureTime.getTime() - duration;
        const hasValidRoute = this.hasValidRoute(queryState, arrivalTimeByTransfers, departureTime);
        if (departureTime < queryState.query.minimumDepartureTime.getTime() || !hasValidRoute) {
            return;
        }
        let profilesByDepartureStop = queryState.profilesByStop[stop.id];
        if (!profilesByDepartureStop) {
            profilesByDepartureStop =
                queryState.profilesByStop[stop.id] =
                    [Profile_1.default.create(queryState.query.maximumTransfers)];
        }
        const earliestDepTimeProfile = profilesByDepartureStop[profilesByDepartureStop.length - 1];
        // If arrival times for all numbers of legs are equal to the earliest entry, this
        // entry is redundant
        let useful = false;
        if (!earliestDepTimeProfile.isDominated(arrivalTimeByTransfers, departureTime)) {
            useful = true;
            const currentTransferProfiles = earliestDepTimeProfile.transferProfiles;
            const transferProfiles = [];
            for (let amountOfTransfers = 0; amountOfTransfers < currentTransferProfiles.length; amountOfTransfers++) {
                const transferProfile = currentTransferProfiles[amountOfTransfers];
                const newTransferProfile = {
                    exitConnection: undefined,
                    enterConnection: undefined,
                    arrivalTime: Infinity,
                    departureTime: Infinity,
                };
                const possibleExitConnection = queryState.earliestArrivalByTrip[connection.tripId][amountOfTransfers].connection || connection;
                if (arrivalTimeByTransfers[amountOfTransfers].arrivalTime < transferProfile.arrivalTime &&
                    connection.pickupType !== PickupType_1.default.NotAvailable &&
                    possibleExitConnection.dropOffType !== DropOffType_1.default.NotAvailable) {
                    newTransferProfile.enterConnection = connection;
                    newTransferProfile.exitConnection = possibleExitConnection;
                    newTransferProfile.departureTime = departureTime;
                    if (this.eventBus && this.eventBus.listenerCount(EventType_1.default.AddedNewTransferProfile) > 0) {
                        this.emitTransferProfile(newTransferProfile, amountOfTransfers);
                    }
                }
                else {
                    newTransferProfile.enterConnection = transferProfile.enterConnection;
                    newTransferProfile.exitConnection = transferProfile.exitConnection;
                    newTransferProfile.departureTime = transferProfile.departureTime;
                }
                if (newTransferProfile.exitConnection && newTransferProfile.enterConnection) {
                    newTransferProfile.arrivalTime = arrivalTimeByTransfers[amountOfTransfers].arrivalTime;
                }
                transferProfiles.push(newTransferProfile);
            }
            const profileIsValid = transferProfiles.reduce((memo, { arrivalTime }) => memo || (arrivalTime && arrivalTime !== Infinity), false);
            if (!profileIsValid) {
                return false;
            }
            const newProfile = Profile_1.default.createFromTransfers(departureTime, transferProfiles);
            let profileIndex = profilesByDepartureStop.length - 1;
            let earliestProfile = profilesByDepartureStop[profileIndex];
            if (earliestProfile.departureTime === Infinity) {
                profilesByDepartureStop[profileIndex] = newProfile;
            }
            else {
                while (profileIndex > 0 && earliestProfile.departureTime < departureTime) {
                    profilesByDepartureStop[profileIndex + 1] = earliestProfile;
                    profileIndex--;
                    earliestProfile = profilesByDepartureStop[profileIndex];
                }
                profilesByDepartureStop[profileIndex + 1] = newProfile;
            }
            return useful;
        }
    }
};
CSAProfile = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(types_1.default.ConnectionsProvider)),
    __param(1, inversify_1.inject(types_1.default.LocationResolver)),
    __param(2, inversify_1.inject(types_1.default.ReachableStopsFinder)),
    __param(2, inversify_1.tagged("phase", ReachableStopsSearchPhase_1.default.Initial)),
    __param(3, inversify_1.inject(types_1.default.ReachableStopsFinder)),
    __param(3, inversify_1.tagged("phase", ReachableStopsSearchPhase_1.default.Transfer)),
    __param(4, inversify_1.inject(types_1.default.ReachableStopsFinder)),
    __param(4, inversify_1.tagged("phase", ReachableStopsSearchPhase_1.default.Final)),
    __param(5, inversify_1.inject(types_1.default.JourneyExtractor)),
    __metadata("design:paramtypes", [Object, Object, Object, Object, Object, Object])
], CSAProfile);
exports.default = CSAProfile;
//# sourceMappingURL=CSAProfile.js.map