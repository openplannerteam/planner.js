enum EventType {
  Query = "query",
  SubQuery = "sub-query",
  AbortQuery = "abort-query",
  InvalidQuery = "invalid-query",

  LDFetchGet = "ldfetch-get",

  Warning = "warning",

  ConnectionPrefetch = "connection-prefetch",
  ConnectionIteratorView = "connection-iterator-view",

  FetchTile = "fetch-tile",
  PointReached = "point-reached",

  ConnectionScan = "connection-scan",
  FinalReachableStops = "final-reachable-stops",
  InitialReachableStops = "initial-reachable-stops",
  AddedNewTransferProfile = "added-new-transfer-profile",

  ReachableStop = "ReachableStop",
  ReachableTile = "ReachableTile",
}

export default EventType;
