import IConnection from "../../entities/connections/connections";

export function forwardsConnectionSelector(connections: IConnection[]): number {
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
        } else if (connection.departureTime === earliest.departureTime
            && connection.arrivalTime < earliest.arrivalTime) {
            earliestIndex = i;
            earliest = connection;
        }
    }

    return earliestIndex;
}

export function backwardsConnectionsSelector(connections: IConnection[]): number {
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
