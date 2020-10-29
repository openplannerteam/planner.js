"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class LinkedConnectionsPage {
    constructor(id, connections, previousPageId, nextPageId) {
        this.id = id;
        this.previousPageId = previousPageId;
        this.nextPageId = nextPageId;
        this.connections = connections;
    }
    getConnections() {
        return this.connections;
    }
    getPreviousPageId() {
        return this.previousPageId;
    }
    getNextPageId() {
        return this.nextPageId;
    }
    getLowerBound() {
        return this.connections[0].departureTime;
    }
    getUpperBound() {
        return this.connections[this.connections.length - 1].departureTime;
    }
}
exports.LinkedConnectionsPage = LinkedConnectionsPage;
//# sourceMappingURL=page.js.map