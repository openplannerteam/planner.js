import IConnection from "./connections";
export declare class LinkedConnectionsPage {
    id: string;
    private previousPageId;
    private nextPageId;
    private connections;
    constructor(id: string, connections: IConnection[], previousPageId: string, nextPageId: string);
    getConnections(): IConnection[];
    getPreviousPageId(): string;
    getNextPageId(): string;
    getLowerBound(): Date;
    getUpperBound(): Date;
}
export interface ILinkedConnectionsPageIndex {
    [id: string]: Promise<LinkedConnectionsPage>;
}
