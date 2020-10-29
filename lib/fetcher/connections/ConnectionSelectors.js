"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function forwardsConnectionSelector(connections) {
    if (connections.length === 1) {
        return 0;
    }
    let earliestIndex = 0;
    let earliest = connections[earliestIndex];
    for (let i = 1; i < connections.length; i++) {
        const connection = connections[i];
        if (connection.departureTime < earliest.departureTime) {
            earliestIndex = i;
            earliest = connection;
        }
        else if (connection.departureTime === earliest.departureTime
            && connection.arrivalTime < earliest.arrivalTime) {
            earliestIndex = i;
            earliest = connection;
        }
    }
    return earliestIndex;
}
exports.forwardsConnectionSelector = forwardsConnectionSelector;
function backwardsConnectionsSelector(connections) {
    if (connections.length === 1) {
        return 0;
    }
    let latestIndex = 0;
    let latest = connections[latestIndex];
    for (let i = 1; i < connections.length; i++) {
        const connection = connections[i];
        if (connection.departureTime > latest.departureTime) {
            latestIndex = i;
            latest = connection;
        }
    }
    return latestIndex;
}
exports.backwardsConnectionsSelector = backwardsConnectionsSelector;
//# sourceMappingURL=ConnectionSelectors.js.map