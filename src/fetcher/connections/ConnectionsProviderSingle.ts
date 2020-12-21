import { AsyncIterator } from "asynciterator";

import { EventType } from "../..";
import { IConnectionsSourceConfig } from "../../Catalog";
import IConnection from "../../entities/connections/connections";
import { ILinkedConnectionsPageIndex, LinkedConnectionsPage } from "../../entities/connections/page";
import { HydraTemplate } from "../../entities/hydra/search";
import GeometryValue from "../../entities/tree/geometry";
import EventBus from "../../events/EventBus";
import { ConnectionsFetcherFactory } from "../../types";
import MergeIterator from "../../util/iterators/MergeIterator";
import IHydraTemplateFetcher from "../hydra/IHydraTemplateFetcher";
import BackwardConnectionIterator from "./BackwardConnectionIterator";
import { backwardsConnectionsSelector, forwardsConnectionSelector } from "./ConnectionSelectors";
import ForwardConnectionIterator from "./ForwardConnectionIterator";
import IConnectionsFetcher from "./IConnectionsFetcher";
import IConnectionsIteratorOptions from "./IConnectionsIteratorOptions";
import IConnectionsProvider from "./IConnectionsProvider";

export default class ConnectionsProviderSingle implements IConnectionsProvider {
    protected fetcher: IConnectionsFetcher;
    protected templateFetcher: IHydraTemplateFetcher;
    protected pages: ILinkedConnectionsPageIndex = {};
    protected source: IConnectionsSourceConfig;
    protected template: Promise<HydraTemplate>;

    constructor(
        connectionsFetcherFactory: ConnectionsFetcherFactory,
        catalog: IConnectionsSourceConfig,
        templateFetcher: IHydraTemplateFetcher,
    ) {
        const { accessUrl, travelMode } = catalog;
        this.source = catalog;
        this.fetcher = connectionsFetcherFactory(travelMode);
        this.templateFetcher = templateFetcher;
    }

    public addConnectionSource(source: IConnectionsSourceConfig) {
        throw new Error("Method not implemented.");
    }

    public getSources(): IConnectionsSourceConfig[] {
        return [this.source];
    }

    public async getByUrl(url: string): Promise<LinkedConnectionsPage> {
        if (!this.pages[url]) {
            this.pages[url] = this.fetcher.get(url);
        }

        return await this.pages[url];
    }

    public async getByTime(date: Date, region?: GeometryValue): Promise<LinkedConnectionsPage> {
        // TODO, look up in the index -- use lower/upper bounds of each page
        const url = await this.getIdForTime(date, region);
        return this.getByUrl(url);
    }

    public async getIdForTime(date: Date, region?: GeometryValue): Promise<string> {
        const template = await this.getTemplate();
        if (region) {
            return template.fill({
                "http://www.opengis.net/ont/geosparql#hasGeometry": region.id,
                "http://semweb.mmlab.be/ns/linkedconnections#departureTimeQuery": date.toISOString(),
            });
        } else {
            return template.fill({
                "http://semweb.mmlab.be/ns/linkedconnections#departureTimeQuery": date.toISOString(),
            });
        }
    }

    public prefetchConnections(lowerBound: Date, upperBound: Date): void {
        this.createIterator({
            upperBoundDate: upperBound,
            lowerBoundDate: lowerBound,
            region: null,
        }).then((iterator) => {
            iterator.on("readable", () => {
                while (iterator.read()) {
                    //
                }
            });
        });
    }

    public async appendIterator(
        options: IConnectionsIteratorOptions,
        existingIterator: AsyncIterator<IConnection>,
    ): Promise<AsyncIterator<IConnection>> {
        EventBus.getInstance().emit(
            EventType.ConnectionIteratorView,
            {
                lowerBound: options.lowerBoundDate,
                upperBound: options.upperBoundDate,
            },
        );

        const selector = options.backward ? backwardsConnectionsSelector : forwardsConnectionSelector;

        let iterator: AsyncIterator<IConnection>;
        if (options.backward) {
            const beginTime = options.upperBoundDate;
            const beginUrl = await this.getIdForTime(beginTime, options.region);
            iterator = new BackwardConnectionIterator(this, options, beginUrl);
        } else {
            const beginTime = options.lowerBoundDate;
            const beginUrl = await this.getIdForTime(beginTime, options.region);
            iterator = new ForwardConnectionIterator(this, options, beginUrl);
        }

        const dataListeners = existingIterator.listeners("data");
        const readListeners = existingIterator.listeners("readable");
        const endListeners = existingIterator.listeners("end");

        existingIterator.removeAllListeners();

        const mergedIterator = new MergeIterator([iterator, existingIterator], selector);
        for (const listener of dataListeners) {
            mergedIterator.addListener("data", listener as (...args: any[]) => void);
        }
        for (const listener of readListeners) {
            mergedIterator.addListener("readable", listener as (...args: any[]) => void);
        }
        for (const listener of endListeners) {
            mergedIterator.addListener("end", listener as (...args: any[]) => void);
        }

        return mergedIterator;
    }

    public async createIterator(options: IConnectionsIteratorOptions): Promise<AsyncIterator<IConnection>> {
        EventBus.getInstance().emit(
            EventType.ConnectionIteratorView,
            {
                lowerBound: options.lowerBoundDate,
                upperBound: options.upperBoundDate,
            },
        );

        let iterator: AsyncIterator<IConnection>;
        if (options.backward) {
            const beginTime = options.upperBoundDate;
            const beginUrl = await this.getIdForTime(beginTime, options.region);
            iterator = new BackwardConnectionIterator(this, options, beginUrl);
        } else {
            const beginTime = options.lowerBoundDate;
            const beginUrl = await this.getIdForTime(beginTime, options.region);
            iterator = new ForwardConnectionIterator(this, options, beginUrl);
        }

        return iterator.on("end", () => {
            EventBus.getInstance().emit(
                EventType.ConnectionIteratorView,
                {
                    lowerBound: options.lowerBoundDate,
                    upperBound: options.upperBoundDate,
                    finished: true,
                },
            );
        });
    }

    protected async getTemplate(): Promise<HydraTemplate> {
        if (!this.template) {
            this.template = this.templateFetcher.get(this.source.accessUrl);
        }
        return this.template;
    }
}
