declare enum EventType {
    Query = "query",
    SubQuery = "sub-query",
    AbortQuery = "abort-query",
    InvalidQuery = "invalid-query",
    Warning = "warning",
    ConnectionPrefetch = "connection-prefetch",
    ConnectionIteratorView = "connection-iterator-view",
    ConnectionScan = "connection-scan",
    FinalReachableStops = "final-reachable-stops",
    InitialReachableStops = "initial-reachable-stops",
    AddedNewTransferProfile = "added-new-transfer-profile",
    ReachableLocation = "ReachableLocation",
    ReachableID = "ReachableID",
    ReachableTile = "ReachableTile",
    ReachableTransfer = "ReachableTransfer",
    ResourceFetch = "ResourceFetch",
    ZoiZone = "ZoiZone"
}
export default EventType;
