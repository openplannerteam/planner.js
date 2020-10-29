"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cross_fetch_1 = __importDefault(require("cross-fetch"));
const inversify_1 = require("inversify");
const __1 = require("../..");
const page_1 = require("../../entities/connections/page");
const DropOffType_1 = __importDefault(require("../../enums/DropOffType"));
const PickupType_1 = __importDefault(require("../../enums/PickupType"));
const EventBus_1 = __importDefault(require("../../events/EventBus"));
const EventType_1 = __importDefault(require("../../events/EventType"));
const JSONLDContext_1 = __importDefault(require("../../uri/JSONLDContext"));
const ARRIVAL_STOP = "http://semweb.mmlab.be/ns/linkedconnections#arrivalStop";
const ARRIVAL_TIME = "http://semweb.mmlab.be/ns/linkedconnections#arrivalTime";
const ARRIVAL_DELAY = "http://semweb.mmlab.be/ns/linkedconnections#arrivalDelay";
const DEPARTURE_STOP = "http://semweb.mmlab.be/ns/linkedconnections#departureStop";
const DEPARTURE_TIME = "http://semweb.mmlab.be/ns/linkedconnections#departureTime";
const DEPARTURE_DELAY = "http://semweb.mmlab.be/ns/linkedconnections#departureDelay";
const NEXT_CONNECTION = "http://semweb.mmlab.be/ns/linkedconnections#nextConnection";
const DROP_OFF_TYPE = "http://vocab.gtfs.org/terms#dropOffType";
const HEADSIGN = "http://vocab.gtfs.org/terms#headsign";
const PICKUP_TYPE = "http://vocab.gtfs.org/terms#pickupType";
const ROUTE = "http://vocab.gtfs.org/terms#route";
const TRIP = "http://vocab.gtfs.org/terms#trip";
let ConnectionsFetcherRaw = 
// tslint:disable: no-string-literal
class ConnectionsFetcherRaw {
    setTravelMode(travelMode) {
        this.travelMode = travelMode;
    }
    async get(url) {
        const beginTime = new Date();
        const response = await cross_fetch_1.default(url);
        const size = this.parseResponseLength(response);
        const duration = (new Date()).getTime() - beginTime.getTime();
        const responseText = await response.text();
        if (response.status !== 200) {
            EventBus_1.default.getInstance().emit(EventType_1.default.Warning, `${url} responded with status code ${response.status}`);
        }
        if (response.status === 200 && responseText) {
            const blob = JSON.parse(responseText);
            const connections = [];
            const context = new JSONLDContext_1.default(blob["@context"]);
            for (const entity of blob["@graph"]) {
                for (const [name, data] of Object.entries(entity)) {
                    entity[context.resolveIdentifier(name)] = data;
                }
                const connectionId = context.resolveIdentifier(entity["@id"]);
                const arrivalTime = new Date(entity[ARRIVAL_TIME]);
                const arrivalStop = context.resolveIdentifier(entity[ARRIVAL_STOP]);
                const arrivalDelay = entity[ARRIVAL_DELAY] ? parseFloat(entity[ARRIVAL_DELAY]) : 0;
                const departureTime = new Date(entity[DEPARTURE_TIME]);
                const departureStop = context.resolveIdentifier(entity[DEPARTURE_STOP]);
                const departureDelay = entity[DEPARTURE_DELAY] ? parseFloat(entity[DEPARTURE_DELAY]) : 0;
                const tripId = entity[TRIP] ? context.resolveIdentifier(entity[TRIP]) : null;
                const route = entity[ROUTE] ? context.resolveIdentifier(entity[ROUTE]) : null;
                const dropOffType = entity[DROP_OFF_TYPE] ?
                    context.resolveIdentifier(entity[DROP_OFF_TYPE]) :
                    DropOffType_1.default.Regular;
                const pickupType = entity[PICKUP_TYPE] ?
                    context.resolveIdentifier(entity[PICKUP_TYPE]) :
                    PickupType_1.default.Regular;
                const headsign = entity[HEADSIGN] || null;
                const connection = {
                    id: connectionId,
                    travelMode: this.travelMode,
                    arrivalTime,
                    arrivalStop,
                    arrivalDelay,
                    departureTime,
                    departureStop,
                    departureDelay,
                    tripId,
                    route,
                    dropOffType,
                    pickupType,
                    headsign,
                };
                if (connection.departureTime < connection.arrivalTime) {
                    // safety precaution
                    connections.push(connection);
                }
            }
            const pageId = blob["@id"];
            const nextPageUrl = blob["hydra:next"];
            const previousPageUrl = blob["hydra:previous"];
            connections.sort((a, b) => {
                if (a.departureTime.getTime() !== b.departureTime.getTime()) {
                    return a.departureTime.getTime() - b.departureTime.getTime();
                }
                else if (a.arrivalTime.getTime() !== b.arrivalTime.getTime()) {
                    return a.arrivalTime.getTime() - b.arrivalTime.getTime();
                }
                return a.id.localeCompare(b.id);
            });
            EventBus_1.default.getInstance().emit(EventType_1.default.ResourceFetch, {
                datatype: __1.DataType.Connections,
                url,
                duration,
                size,
            });
            return new page_1.LinkedConnectionsPage(pageId, connections, previousPageUrl, nextPageUrl);
        }
        else {
            return new page_1.LinkedConnectionsPage(url, [], undefined, undefined);
        }
    }
    parseResponseLength(response) {
        if (response.headers.get("content-length")) {
            return parseInt(response.headers.get("content-length"), 10);
        }
        else {
            try {
                return response.body._chunkSize;
            }
            catch (e) {
                //
            }
        }
    }
};
ConnectionsFetcherRaw = __decorate([
    inversify_1.injectable()
    // tslint:disable: no-string-literal
], ConnectionsFetcherRaw);
exports.default = ConnectionsFetcherRaw;
//# sourceMappingURL=ConnectionsFetcherRaw.js.map