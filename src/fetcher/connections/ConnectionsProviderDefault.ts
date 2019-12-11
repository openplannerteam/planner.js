import { AsyncIterator } from "asynciterator";
import { PromiseProxyIterator } from "asynciterator-promiseproxy";

import { inject, injectable } from "inversify";
import { EventType } from "../..";
import Catalog from "../../Catalog";
import IConnection from "../../entities/connections/connections";
import { ILinkedConnectionsPageIndex, LinkedConnectionsPage } from "../../entities/connections/page";
import { HydraTemplate } from "../../entities/hydra/search";
import EventBus from "../../events/EventBus";
import TYPES, { ConnectionsFetcherFactory } from "../../types";
import IHydraTemplateFetcher from "../hydra/IHydraTemplateFetcher";
import BackwardConnectionIterator from "./BackwardConnectionIterator";
import ForwardConnectionIterator from "./ForwardConnectionIterator";
import IConnectionsFetcher from "./IConnectionsFetcher";
import IConnectionsIteratorOptions from "./IConnectionsIteratorOptions";
import IConnectionsProvider from "./IConnectionsProvider";

@injectable()
export default class ConnectionsProviderDefault implements IConnectionsProvider {

    protected fetcher: IConnectionsFetcher;
    protected templateFetcher: IHydraTemplateFetcher;
    protected pages: ILinkedConnectionsPageIndex = {};
    protected accessUrl: string;
    protected template: Promise<HydraTemplate>;

    constructor(
        @inject(TYPES.ConnectionsFetcherFactory) connectionsFetcherFactory: ConnectionsFetcherFactory,
        @inject(TYPES.Catalog) catalog: Catalog,
        @inject(TYPES.HydraTemplateFetcher) templateFetcher: IHydraTemplateFetcher,
    ) {
        if (catalog.connectionsSourceConfigs.length > 1) {
            throw (new Error("Use the ConnectionsProviderMerge if you have multiple connections sources"));
        }

        const { accessUrl, travelMode } = catalog.connectionsSourceConfigs[0];
        this.accessUrl = accessUrl;
        this.fetcher = connectionsFetcherFactory(travelMode);
        this.templateFetcher = templateFetcher;
    }

    public async getByUrl(url: string): Promise<LinkedConnectionsPage> {
        if (!this.pages[url]) {
            this.pages[url] = this.fetcher.get(url);
        }

        return await this.pages[url];
    }

    public async getByTime(date: Date): Promise<LinkedConnectionsPage> {
        // TODO, look up in the index -- use lower/upper bounds of each page
        const url = await this.getIdForTime(date);
        return this.getByUrl(url);
    }

    public async getIdForTime(date: Date): Promise<string> {
        const template = await this.getTemplate();
        return template.fill({
            "http://semweb.mmlab.be/ns/linkedconnections#departureTimeQuery": date.toISOString(),
        });
    }

    public prefetchConnections(lowerBound: Date, upperBound: Date): void {
        this.createIterator({
            upperBoundDate: upperBound,
            lowerBoundDate: lowerBound,
        }).then((iterator) => {
            iterator.on("readable", () => {
                while (iterator.read()) {
                    //
                }
            });
        });
    }

    public async createIterator(options: IConnectionsIteratorOptions): Promise<AsyncIterator<IConnection>> {
        EventBus.getInstance().emit(
            EventType.ConnectionIteratorView,
            options.lowerBoundDate,
            options.upperBoundDate,
        );

        let iterator: AsyncIterator<IConnection>;
        if (options.backward) {
            const beginTime = options.upperBoundDate;
            const beginUrl = await this.getIdForTime(beginTime);
            iterator = new BackwardConnectionIterator(this, options, beginUrl);
        } else {
            const beginTime = options.lowerBoundDate;
            const beginUrl = await this.getIdForTime(beginTime);
            iterator = new ForwardConnectionIterator(this, options, beginUrl);
        }

        return iterator.on("end", () => {
            EventBus.getInstance().emit(
                EventType.ConnectionIteratorView,
                options.lowerBoundDate,
                options.upperBoundDate,
                true,
            );
        });
    }

    protected async getTemplate(): Promise<HydraTemplate> {
        if (!this.template) {
            this.template = this.templateFetcher.get(this.accessUrl);
        }
        return this.template;
    }
}
