enum EventType {
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

  ReachableLocation = "ReachableLocation",  // planning reached a location
  ReachableID = "ReachableID",  // planning reached a location, but the value is just a ID
  ReachableTile = "ReachableTile", // planning reached a tile (coordinate)
  ReachableTranfer = "ReachableTransfer", // planning reached a transfer

  ResourceFetch = "ResourceFetch",
}

export default EventType;
