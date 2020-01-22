import { inject, injectable } from "inversify";
import LDFetch from "ldfetch";
import { DataType, EventType } from "../..";
import { IStopsSourceConfig } from "../../Catalog";
import EventBus from "../../events/EventBus";
import TYPES from "../../types";
import IStop from "./IStop";
import IStopsFetcher from "./IStopsFetcher";

interface IPartialStopMap {
    [stopId: string]: Partial<IStop>;
}

interface IStopMap {
    [stopId: string]: IStop;
}

@injectable()
// tslint:disable: no-string-literal
export default class StopsFetcherRaw implements IStopsFetcher {

    private accessUrl: string;

    private ldFetch: LDFetch;
    private loadPromise: Promise<any>;
    private stops: IStopMap;

    constructor(
        @inject(TYPES.LDFetch) ldFetch: LDFetch,
    ) {
        this.ldFetch = ldFetch;
    }

    public addStopSource(source: IStopsSourceConfig) {
        throw new Error("Method not implemented.");
    }

    public getSources(): IStopsSourceConfig[] {
        return [{ accessUrl: this.accessUrl }];
    }

    public setAccessUrl(accessUrl: string) {
        this.accessUrl = accessUrl;
    }

    public prefetchStops(): void {
        this.ensureStopsLoaded();
    }

    public async getStopById(stopId: string): Promise<IStop> {
        await this.ensureStopsLoaded();

        return this.stops[stopId];
    }

    public async getAllStops(): Promise<IStop[]> {
        await this.ensureStopsLoaded();

        return Object.values(this.stops);
    }

    private async ensureStopsLoaded() {
        if (!this.loadPromise && !this.stops) {
            this.loadStops();
        }

        if (this.loadPromise) {
            await this.loadPromise;
        }
    }

    private loadStops() {
        this.loadPromise = this.getByUrl(this.accessUrl)
            .then((stops) => {
                this.stops = stops;
                this.loadPromise = null;
            })
            .catch((reason) => {
                console.log(reason);
            });
    }

    private async getByUrl(url: string): Promise<IStopMap> {
        const beginTime = new Date();

        const response = await fetch(url);
        const responseText = await response.text();

        const size = this.parseResponseLength(response);
        const duration = (new Date()).getTime() - beginTime.getTime();

        const stops: IStopMap = {};

        if (response.status !== 200) {
            EventBus.getInstance().emit(EventType.Warning, `${url} responded with status code ${response.status}`);
        }

        if (response.status === 200 && responseText) {
            const blob = JSON.parse(responseText);

            for (const entity of blob["@graph"]) {
                const id = entity["@id"];
                const latitudeRaw = entity["http://www.w3.org/2003/01/geo/wgs84_pos#lat"] || entity["latitude"];
                const longitudeRaw = entity["http://www.w3.org/2003/01/geo/wgs84_pos#long"] || entity["longitude"];
                const stopTimeRaw = entity["avgStopTimes"] || 0;
                const stop: IStop = {
                    id: entity["@id"],
                    latitude: parseFloat(latitudeRaw),
                    longitude: parseFloat(longitudeRaw),
                    name: entity["name"],
                    avgStopTimes: parseFloat(stopTimeRaw) * 1000,
                };
                stops[id] = stop;
            }
        }

        EventBus.getInstance().emit(
            EventType.ResourceFetch,
            {
                DataType: DataType.Stops,
                url,
                duration,
                size,
            },
        );

        return stops;
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
