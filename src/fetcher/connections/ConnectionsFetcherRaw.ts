import fetch from "cross-fetch";
import { injectable } from "inversify";
import { DataType } from "../..";
import IConnection from "../../entities/connections/connections";
import { LinkedConnectionsPage } from "../../entities/connections/page";
import DropOffType from "../../enums/DropOffType";
import PickupType from "../../enums/PickupType";
import TravelMode from "../../enums/TravelMode";
import EventBus from "../../events/EventBus";
import EventType from "../../events/EventType";
import JSONLDContext from "../../uri/JSONLDContext";
import IConnectionsFetcher from "./IConnectionsFetcher";

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

@injectable()
// tslint:disable: no-string-literal
export default class ConnectionsFetcherRaw implements IConnectionsFetcher {
    protected travelMode: TravelMode;

    public setTravelMode(travelMode: TravelMode) {
        this.travelMode = travelMode;
    }

    public async get(url: string): Promise<LinkedConnectionsPage> {
        const beginTime = new Date();

        const response = await fetch(url);
        const size = this.parseResponseLength(response);
        const duration = (new Date()).getTime() - beginTime.getTime();

        const responseText = await response.text();
        if (response.status !== 200) {
            EventBus.getInstance().emit(EventType.Warning, `${url} responded with status code ${response.status}`);
        }
        if (response.status === 200 && responseText) {
            const blob = JSON.parse(responseText);

            const connections: IConnection[] = [];
            const context = new JSONLDContext(blob["@context"]);

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
                    context.resolveIdentifier(entity[DROP_OFF_TYPE]) as DropOffType :
                    DropOffType.Regular;
                const pickupType = entity[PICKUP_TYPE] ?
                    context.resolveIdentifier(entity[PICKUP_TYPE]) as PickupType :
                    PickupType.Regular;
                const headsign = entity[HEADSIGN] || null;
                const connection: IConnection = {
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
                } else if (a.arrivalTime.getTime() !== b.arrivalTime.getTime()) {
                    return a.arrivalTime.getTime() - b.arrivalTime.getTime();
                }

                return a.id.localeCompare(b.id);
            });

            EventBus.getInstance().emit(
                EventType.ResourceFetch,
                {
                    datatype: DataType.Connections,
                    url,
                    duration,
                    size,
                },
            );

            return new LinkedConnectionsPage(pageId, connections, previousPageUrl, nextPageUrl);
        } else {
            return new LinkedConnectionsPage(url, [], undefined, undefined);
        }
    }

    private parseResponseLength(response): number {
        if (response.headers.get("content-length")) {
            return parseInt(response.headers.get("content-length"), 10);
        } else {
            try {
                return response.body._chunkSize;
            } catch (e) {
                //
            }
        }
    }
}
