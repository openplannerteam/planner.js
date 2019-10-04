import IConnection from "./connections";

export class LinkedConnectionsPage {
    public id: string;
    private previousPageId: string;
    private nextPageId: string;
    private connections: IConnection[];

    constructor(id: string, connections: IConnection[], previousPageId: string, nextPageId: string) {
        this.id = id;
        this.previousPageId = previousPageId;
        this.nextPageId = nextPageId;
        this.connections = connections;
    }

    public getConnections(): IConnection[] {
        return this.connections;
    }

    public getPreviousPageId(): string {
        return this.previousPageId;
    }

    public getNextPageId(): string {
        return this.nextPageId;
    }

    public getLowerBound(): Date {
        return this.connections[0].departureTime;
    }

    public getUpperBound(): Date {
        return this.connections[this.connections.length - 1].departureTime;
    }
}

export interface ILinkedConnectionsPageIndex {
    [id: string]: Promise<LinkedConnectionsPage>;
}
