import { AsyncIterator } from "asynciterator";
import IConnection from "../../entities/connections/connections";
import { LinkedConnectionsPage } from "../../entities/connections/page";
import IConnectionsIteratorOptions from "./IConnectionsIteratorOptions";
import IConnectionsProvider from "./IConnectionsProvider";

export default class ForwardConnectionIterator extends AsyncIterator<IConnection> {

    private connectionsProvider: IConnectionsProvider;
    private options: IConnectionsIteratorOptions;

    private waiting: boolean;
    private currentPage: LinkedConnectionsPage;
    private currentIndex: number;

    constructor(
        provider: IConnectionsProvider,
        options: IConnectionsIteratorOptions,
        beginUrl: string,
    ) {
        super();

        this.connectionsProvider = provider;
        this.options = options;
        this.waiting = false;
        this.fetchPage(beginUrl);
    }

    public async fetchPage(url) {
        if (!this.waiting) {
            // start fetching a page
            this.readable = false;
            this.waiting = true;
            this.currentPage = null;
            this.currentPage = await this.connectionsProvider.getByUrl(url);
            this.waiting = false;
            this.currentIndex = 0;
            this.readable = true;

            if (this.currentPage.getNextPageId()) {
                // prefetch the next page to reduce IO
                this.connectionsProvider.getByUrl(this.currentPage.getNextPageId());
            }
        }
    }

    public read(): IConnection {
        if (this.closed) {
            return null;
        }

        if (this.waiting) {
            // waiting for the next page to be fetched
            this.readable = false;
            return null;
        }

        if (this.currentIndex >= this.currentPage.getConnections().length) {
            // end of this page, fetch the next one
            this.fetchPage(this.currentPage.getNextPageId());
            return null;
        }

        const item = this.currentPage.getConnections()[this.currentIndex];
        this.currentIndex += 1;

        if (this.options.upperBoundDate && item.departureTime > this.options.upperBoundDate) {
            // no more relevant connections
            this.close();
        }

        return item;
    }
}
