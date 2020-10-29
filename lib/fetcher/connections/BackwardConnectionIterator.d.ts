import { AsyncIterator } from "asynciterator";
import IConnection from "../../entities/connections/connections";
import IConnectionsIteratorOptions from "./IConnectionsIteratorOptions";
import IConnectionsProvider from "./IConnectionsProvider";
export default class BackwardConnectionIterator extends AsyncIterator<IConnection> {
    private connectionsProvider;
    private options;
    private waiting;
    private currentPage;
    private currentIndex;
    constructor(provider: IConnectionsProvider, options: IConnectionsIteratorOptions, beginUrl: string);
    fetchPage(url: any): Promise<void>;
    read(): IConnection;
}
