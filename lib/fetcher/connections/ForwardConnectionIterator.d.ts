import { AsyncIterator } from "asynciterator";
import IConnection from "../../entities/connections/connections";
import IConnectionsIteratorOptions from "./IConnectionsIteratorOptions";
import IConnectionsProvider from "./IConnectionsProvider";
export default class ForwardConnectionIterator extends AsyncIterator<IConnection> {
    private connectionsProvider;
    private options;
    private waiting;
    private currentPage;
    private currentIndex;
    private count;
    constructor(provider: IConnectionsProvider, options: IConnectionsIteratorOptions, beginUrl: string);
    fetchPage(url: any): Promise<void>;
    read(): IConnection;
}
