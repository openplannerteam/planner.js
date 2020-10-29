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
const FootpathQueue_1 = __importDefault(require("./CSA/FootpathQueue"));
const JourneyExtractorEarliestArrival_1 = __importDefault(require("./JourneyExtractorEarliestArrival"));
// Implementation is as close as possible to the original paper: https://arxiv.org/pdf/1703.05997.pdf
let CSAEarliestArrival = class CSAEarliestArrival {
    constructor(connectionsProvider, locationResolver, transferReachableStopsFinder, initialReachableStopsFinder, finalReachableStopsFinder) {
        this.connectionsProvider = connectionsProvider;
        this.locationResolver = locationResolver;
        this.transferReachableStopsFinder = transferReachableStopsFinder;
        this.initialReachableStopsFinder = initialReachableStopsFinder;
        this.finalReachableStopsFinder = finalReachableStopsFinder;
        this.eventBus = EventBus_1.default.getInstance();
        this.journeyExtractor = new JourneyExtractorEarliestArrival_1.default(locationResolver);
    }
    async plan(query) {
        const { minimumDepartureTime: lowerBoundDate, maximumArrivalTime: upperBoundDate, } = query;
        const footpathsQueue = new FootpathQueue_1.default();
        const connectionsIterator = await this.connectionsProvider.createIterator({
            upperBoundDate,
            lowerBoundDate,
            excludedModes: query.excludedTravelModes,
            region: null,
        });
        const connectionsQueue = new MergeIterator_1.default([connectionsIterator, footpathsQueue], ConnectionSelectors_1.forwardsConnectionSelector, true);
        const queryState = {
            finalReachableStops: {},
            profilesByStop: {},
            enterConnectionByTrip: {},
            footpathsQueue,
            connectionsQueue,
        };
        const [hasInitialReachableStops, hasFinalReachableStops] = await Promise.all([
            this.initInitialReachableStops(queryState, query),
            this.initFinalReachableStops(queryState, query),
        ]);
        if (!hasInitialReachableStops || !hasFinalReachableStops) {
            return Promise.resolve(new asynciterator_1.ArrayIterator([]));
        }
        const self = this;
        return new Promise((resolve, reject) => {
            let isDone = false;
            const done = () => {
                if (!isDone) {
                    connectionsQueue.close();
                    self.extractJourneys(queryState, query)
                        .then((resultIterator) => {
                        resolve(resultIterator);
                    });
                    isDone = true;
                }
            };
            connectionsIterator.on("readable", () => self.processConnections(queryState, query, done));
            connectionsIterator.on("end", () => done());
            // iterator may have become readable before the listener was attached
            self.processConnections(queryState, query, done);
        });
    }
    updateProfile(state, query, connection) {
        /*
        Call this ONLY if the given connection is known to improve the arrival stop's profile
        */
        const tripId = connection.tripId;
        const departureTime = connection.departureTime.getTime();
        const arrivalTime = connection.arrivalTime.getTime();
        // update profile of arrival stop
        const arrivalProfile = {
            departureTime,
            arrivalTime,
            exitConnection: connection,
            enterConnection: state.enterConnectionByTrip[tripId],
        };
        state.profilesByStop[connection.arrivalStop] = arrivalProfile;
        EventBus_1.default.getInstance().emit(EventType_1.default.ReachableID, connection.arrivalStop);
    }
    async extractJourneys(state, query) {
        return this.journeyExtractor.extractJourneys(state.profilesByStop, query);
    }
    async processConnections(state, query, resolve) {
        const { from, to, minimumDepartureTime } = query;
        const departureStopId = from[0].id;
        const arrivalStopId = to[0].id;
        let connection = state.connectionsQueue.read();
        while (connection && !state.connectionsQueue.closed) {
            if (connection.departureTime < minimumDepartureTime && !state.connectionsQueue.closed) {
                // starting criterion
                // skip connections before the minimum departure time
                connection = state.connectionsQueue.read();
                continue;
            }
            if (this.getProfile(state, arrivalStopId).arrivalTime <= connection.departureTime.getTime()) {
                // stopping criterion
                // we cannot improve the tentative arrival time anymore
                return resolve();
            }
            const tripId = connection.tripId;
            const departureTime = connection.departureTime.getTime();
            const canRemainSeated = state.enterConnectionByTrip[tripId];
            const canTakeTransfer = ((connection.departureStop === departureStopId ||
                this.getProfile(state, connection.departureStop).arrivalTime <= departureTime) &&
                connection.pickupType !== PickupType_1.default.NotAvailable);
            if (canRemainSeated || canTakeTransfer) {
                // enterConnectionByTrip should point to the first reachable connection
                if (!state.enterConnectionByTrip[tripId]) {
                    state.enterConnectionByTrip[tripId] = connection;
                }
                // limited walking optimization
                const canImprove = connection.arrivalTime.getTime() <
                    this.getProfile(state, connection.arrivalStop).arrivalTime;
                const canLeave = connection.dropOffType !== DropOffType_1.default.NotAvailable;
                if (canLeave && canImprove) {
                    this.updateProfile(state, query, connection);
                    await this.scheduleExtraConnections(state, query, connection);
                }
            }
            if (!state.connectionsQueue.closed) {
                connection = state.connectionsQueue.read();
                continue;
            }
            connection = undefined;
        }
    }
    getProfile(state, stopId) {
        if (!state.profilesByStop[stopId]) {
            state.profilesByStop[stopId] = {
                departureTime: Infinity,
                arrivalTime: Infinity,
            };
        }
        return state.profilesByStop[stopId];
    }
    async scheduleExtraConnections(state, query, sourceConnection) {
        try {
            const arrivalStop = await this.locationResolver.resolve(sourceConnection.arrivalStop);
            const reachableStops = await this.transferReachableStopsFinder.findReachableStops(arrivalStop, ReachableStopsFinderMode_1.default.Source, query.maximumTransferDuration, query.minimumWalkingSpeed, query.profileID);
            if (state.finalReachableStops[arrivalStop.id]) {
                reachableStops.push(state.finalReachableStops[arrivalStop.id]);
            }
            for (const reachableStop of reachableStops) {
                const { stop: stop, duration: duration } = reachableStop;
                if (duration && stop.id) {
                    const transferTentativeArrival = this.getProfile(state, stop.id).arrivalTime;
                    const newArrivalTime = new Date(sourceConnection.arrivalTime.getTime() + duration);
                    if (transferTentativeArrival > newArrivalTime.getTime() && newArrivalTime <= query.maximumArrivalTime) {
                        const tripId = `TRANSFER_TO:${sourceConnection.arrivalStop}@${sourceConnection.arrivalTime.getTime()}`;
                        // create a connection that resembles a footpath
                        // TODO, ditch the IReachbleStop and IConnection interfaces and make these proper objects
                        const transferConnection = {
                            id: `${tripId}-${stop.id}`,
                            tripId,
                            travelMode: TravelMode_1.default.Walking,
                            departureTime: sourceConnection.arrivalTime,
                            departureStop: sourceConnection.arrivalStop,
                            arrivalTime: new Date(sourceConnection.arrivalTime.getTime() + duration),
                            arrivalStop: stop.id,
                            dropOffType: DropOffType_1.default.Regular,
                            pickupType: PickupType_1.default.Regular,
                            headsign: stop.id,
                        };
                        state.footpathsQueue.write(transferConnection);
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
    async initInitialReachableStops(state, query) {
        const fromLocation = query.from[0];
        // Making sure the departure location has an id
        const geoId = Geo_1.default.getId(fromLocation);
        if (!fromLocation.id) {
            query.from[0].id = geoId;
            query.from[0].name = "Departure location";
        }
        const reachableStops = await this.initialReachableStopsFinder.findReachableStops(fromLocation, ReachableStopsFinderMode_1.default.Source, query.maximumWalkingDuration, query.minimumWalkingSpeed, query.profileID);
        // Abort when we can't reach a single stop.
        if (reachableStops.length === 0) {
            this.eventBus.emit(EventType_1.default.AbortQuery, "No reachable stops at departure location");
            return false;
        }
        if (this.eventBus) {
            this.eventBus.emit(EventType_1.default.InitialReachableStops, reachableStops);
        }
        for (const reachableStop of reachableStops) {
            const { stop: stop, duration: duration } = reachableStop;
            if (duration) {
                // create a connection that resembles a footpath
                // TODO, ditch the IReachbleStop and IConnection interfaces and make these proper objects
                const transferConnection = {
                    id: `MOVE_TO:${stop.id}`,
                    tripId: `MOVE_TO:${stop.id}`,
                    travelMode: TravelMode_1.default.Walking,
                    departureTime: query.minimumDepartureTime,
                    departureStop: fromLocation.id,
                    arrivalTime: new Date(query.minimumDepartureTime.getTime() + duration),
                    arrivalStop: stop.id,
                    dropOffType: DropOffType_1.default.Regular,
                    pickupType: PickupType_1.default.Regular,
                    headsign: stop.id,
                };
                state.footpathsQueue.write(transferConnection);
            }
        }
        return true;
    }
    async initFinalReachableStops(state, query) {
        const toLocation = query.to[0];
        // Making sure the departure location has an id
        const geoId = Geo_1.default.getId(toLocation);
        if (!toLocation.id) {
            query.to[0].id = geoId;
            query.to[0].name = "Arrival location";
        }
        const reachableStops = await this.finalReachableStopsFinder.findReachableStops(toLocation, ReachableStopsFinderMode_1.default.Target, query.maximumWalkingDuration, query.minimumWalkingSpeed, query.profileID);
        // Abort when we can't reach a single stop.
        if (reachableStops.length === 0) {
            this.eventBus.emit(EventType_1.default.AbortQuery, "No reachable stops at arrival location");
            return false;
        }
        if (this.eventBus) {
            this.eventBus.emit(EventType_1.default.FinalReachableStops, reachableStops);
        }
        for (const reachableStop of reachableStops) {
            if (reachableStop.duration > 0) {
                state.finalReachableStops[reachableStop.stop.id] = {
                    stop: toLocation,
                    duration: reachableStop.duration,
                };
            }
        }
        return true;
    }
};
CSAEarliestArrival = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(types_1.default.ConnectionsProvider)),
    __param(1, inversify_1.inject(types_1.default.LocationResolver)),
    __param(2, inversify_1.inject(types_1.default.ReachableStopsFinder)),
    __param(2, inversify_1.tagged("phase", ReachableStopsSearchPhase_1.default.Transfer)),
    __param(3, inversify_1.inject(types_1.default.ReachableStopsFinder)),
    __param(3, inversify_1.tagged("phase", ReachableStopsSearchPhase_1.default.Initial)),
    __param(4, inversify_1.inject(types_1.default.ReachableStopsFinder)),
    __param(4, inversify_1.tagged("phase", ReachableStopsSearchPhase_1.default.Final)),
    __metadata("design:paramtypes", [Object, Object, Object, Object, Object])
], CSAEarliestArrival);
exports.default = CSAEarliestArrival;
//# sourceMappingURL=CSAEarliestArrival.js.map