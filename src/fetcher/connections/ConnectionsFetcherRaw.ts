import fetch from "cross-fetch";
import { injectable } from "inversify";
import IConnection from "../../entities/connections/connections";
import { LinkedConnectionsPage } from "../../entities/connections/page";
import TravelMode from "../../enums/TravelMode";
import EventBus from "../../events/EventBus";
import EventType from "../../events/EventType";
import IConnectionsFetcher from "./IConnectionsFetcher";

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
        const responseText = await response.text();
        if (response.status !== 200) {
            EventBus.getInstance().emit(EventType.Warning, `${url} responded with status code ${response.status}`);
        }
        if (response.status === 200 && responseText) {
            const blob = JSON.parse(responseText);

            const connections: IConnection[] = [];

            for (const entity of blob["@graph"]) {
                const connectionId = entity["@id"];

                const arrivalTime = new Date(entity["arrivalTime"]);
                const arrivalStop = entity["arrivalStop"];
                const arrivalDelay = entity["arrivalDelay"] ? parseFloat(entity["arrivalDelay"]) : 0;

                const departureTime = new Date(entity["departureTime"]);
                const departureStop = entity["departureStop"];
                const departureDelay = entity["departureDelay"] ? parseFloat(entity["departureDelay"]) : 0;

                const nextConnection = entity["nextConnection"] || [];
                const tripId = entity["gtfs:trip"] || null;

                const route = entity["gtfs:route"] || null;
                const dropOffType = entity["gtfs:dropOffType"];
                const pickupType = entity["gtfs:pickupType"];
                const headsign = entity["direction"] || null;
                const connection: IConnection = {
                    id: connectionId,
                    travelMode: this.travelMode,
                    arrivalTime,
                    arrivalStop,
                    arrivalDelay,
                    departureTime,
                    departureStop,
                    departureDelay,
                    nextConnection,
                    tripId,
                    route,
                    dropOffType,
                    pickupType,
                    headsign,
                };

                connections.push(connection);
            }

            const pageId = blob["@id"];
            const nextPageUrl = blob["hydra:next"];
            const previousPageUrl = blob["hydra:previous"];

            const duration = (new Date()).getTime() - beginTime.getTime();
            EventBus.getInstance().emit(EventType.LDFetchGet, url, duration);
            EventBus.getInstance().emit(EventType.ConnectionPrefetch, connections[0].departureTime);
            EventBus.getInstance().emit(EventType.ConnectionPrefetch,
                connections[connections.length - 1].departureTime);

            return new LinkedConnectionsPage(pageId, connections, previousPageUrl, nextPageUrl);
        } else {
            return new LinkedConnectionsPage(url, [], undefined, undefined);
        }
    }
}
