"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const asynciterator_1 = require("asynciterator");
const asynciterator_promiseproxy_1 = require("asynciterator-promiseproxy");
const default_1 = __importDefault(require("../../configs/default"));
const TravelMode_1 = __importDefault(require("../../enums/TravelMode"));
const EventBus_1 = __importDefault(require("../../events/EventBus"));
const EventType_1 = __importDefault(require("../../events/EventType"));
const types_1 = __importDefault(require("../../types"));
const constants_1 = require("../../uri/constants");
const uri_1 = __importDefault(require("../../uri/uri"));
const Iterators_1 = __importDefault(require("../../util/Iterators"));
const Units_1 = __importDefault(require("../../util/Units"));
const Path_1 = __importDefault(require("../Path"));
/*
          ,-.
          `-'
          /|\
           |                ,-------.             ,-----------.
          / \               |Planner|             |QueryRunner|
      Application           `---+---'             `-----+-----'
           |       query        |                       |
           |------------------->|                       |
           |                    |                       |
           |                    |      run(query)       |
           |                    |---------------------->|
           |                    |                       |
           |                    |           ,----------------------!.
           |                    |           |Resolve ids to objects|_\
           |                    |           `------------------------'
           |                    |                       ----.
           |                    |                           | resolveQuery(query)
           |                    |                       <---'
           |                    |                       |
           |           ,---------------------------------------------------------------!.
           |           |Query is delegated to RoadPlanner or PublicTransportPlanner now|_\
           |           `-----------------------------------------------------------------'
          ,-----------------------------------------!.  |
          |Add context, intermediate path steps, ...|_\ |
          `-------------------------------------------' |
           |                    ----.                   |
           |                        | completePath(path)|
           |                    <---'                   |
           |                    |                       |
           |                    |                       |

*/
/**
 * Allows to ask route planning queries. Emits events defined in [[EventType]]
 */
class Planner {
    /**
     * Initializes a new Planner
     * @param container The container of dependencies we are working with
     */
    constructor(container = default_1.default) {
        // Store container on context before doing anything else
        this.context = container.get(types_1.default.Context);
        this.context.setContainer(container);
        this.queryRunner = container.get(types_1.default.QueryRunner);
        this.profileProvider = container.get(types_1.default.ProfileProvider);
        this.eventBus = EventBus_1.default.getInstance();
        this.roadPlanner = container.get(types_1.default.RoadPlanner);
        this.connectionsProvider = container.get(types_1.default.ConnectionsProvider);
        this.catalogProvider = container.get(types_1.default.CatalogProvider);
        this.stopsProvider = container.get(types_1.default.StopsProvider);
        this.locationResolver = container.get(types_1.default.LocationResolver);
        this.activeProfileID = "https://hdelva.be/profile/pedestrian";
    }
    addConnectionSource(accessUrl, travelMode = TravelMode_1.default.Train) {
        this.connectionsProvider.addConnectionSource({ accessUrl, travelMode });
    }
    addStopSource(accessUrl) {
        this.stopsProvider.addStopSource({ accessUrl });
    }
    getConnectionSources() {
        return this.connectionsProvider.getSources();
    }
    getStopsSources() {
        return this.stopsProvider.getSources();
    }
    async addCatalogSource(accessUrl) {
        const catalog = await this.catalogProvider.getCatalog(accessUrl);
        for (const dataset of catalog.datasets) {
            for (const distribution of dataset.distributions) {
                if (dataset.subject === uri_1.default.inNS(constants_1.LC, "Connection")) {
                    this.connectionsProvider.addConnectionSource({ accessUrl: distribution.accessUrl, travelMode: TravelMode_1.default.Train });
                }
                else if (dataset.subject === uri_1.default.inNS(constants_1.GTFS, "Stop")) {
                    this.stopsProvider.addStopSource({ accessUrl: distribution.accessUrl });
                }
            }
        }
    }
    async completePath(path) {
        const completePath = Path_1.default.create();
        let walkingDeparture;
        let walkingDestination;
        for (const leg of path.legs) {
            if (leg.getTravelMode() === TravelMode_1.default.Walking) {
                if (!walkingDeparture) {
                    walkingDeparture = leg.getStartLocation();
                }
                walkingDestination = leg.getStopLocation();
            }
            else {
                if (walkingDestination) {
                    const walkingPathIterator = await this.roadPlanner.plan({
                        from: [walkingDeparture],
                        to: [walkingDestination],
                        profileID: this.activeProfileID,
                    });
                    const walkingPaths = await Iterators_1.default.toArray(walkingPathIterator);
                    for (const walkingLeg of walkingPaths[0].legs) {
                        completePath.appendLeg(walkingLeg);
                    }
                    completePath.updateContext(walkingPaths[0].getContext());
                    walkingDeparture = null;
                    walkingDestination = null;
                }
                completePath.appendLeg(leg);
            }
        }
        if (walkingDestination) {
            const walkingPathIterator = await this.roadPlanner.plan({
                from: [walkingDeparture],
                to: [walkingDestination],
                profileID: this.activeProfileID,
            });
            const walkingPaths = await Iterators_1.default.toArray(walkingPathIterator);
            for (const walkingLeg of walkingPaths[0].legs) {
                completePath.appendLeg(walkingLeg);
            }
            completePath.updateContext(walkingPaths[0].getContext());
            walkingDeparture = null;
            walkingDestination = null;
        }
        return completePath;
    }
    /**
     * Given an [[IQuery]], it will evaluate the query and return a promise for an AsyncIterator of [[IPath]] instances
     * @param query An [[IQuery]] specifying a route planning query
     * @returns An [[AsyncIterator]] of [[IPath]] instances
     */
    query(query) {
        this.eventBus.emit(EventType_1.default.Query, query);
        query.profileID = this.activeProfileID;
        const pathIterator = new asynciterator_promiseproxy_1.PromiseProxyIterator(() => this.queryRunner.run(query));
        this.eventBus.once(EventType_1.default.AbortQuery, () => {
            pathIterator.close();
        });
        pathIterator.on("error", (e) => {
            if (e && e.eventType) {
                this.eventBus.emit(e.eventType, e.message);
            }
        });
        if (query.minimized) {
            return pathIterator;
        }
        const completeIterator = new asynciterator_1.BufferedIterator();
        pathIterator.on("data", async (path) => {
            const completePath = await this.completePath(path);
            completeIterator._push(completePath);
            if (pathIterator.closed) {
                completeIterator.close();
            }
        });
        return completeIterator;
    }
    prefetchStops() {
        const container = this.context.getContainer();
        const stopsProvider = container.get(types_1.default.StopsProvider);
        if (stopsProvider) {
            stopsProvider.prefetchStops();
        }
    }
    prefetchConnections(from, to) {
        this.connectionsProvider.prefetchConnections(from, to);
    }
    async setDevelopmentProfile(blob) {
        const profileID = await this.profileProvider.parseDevelopmentProfile(blob);
        return this.setProfileID(profileID);
    }
    setProfileID(profileID) {
        this.activeProfileID = profileID;
        return this;
    }
    getAllStops() {
        // fixme, why is this here?
        // is this just for visualizations?
        const container = this.context.getContainer();
        const stopsProvider = container.get(types_1.default.StopsProvider);
        if (stopsProvider) {
            return stopsProvider.getAllStops();
        }
        return Promise.reject();
    }
    resolveLocation(id) {
        return this.locationResolver.resolve(id);
    }
}
exports.default = Planner;
Planner.Units = Units_1.default;
//# sourceMappingURL=Planner.js.map