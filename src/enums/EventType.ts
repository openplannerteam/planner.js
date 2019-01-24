enum EventType {
  Query = "query",
  QueryExponential = "query-exponential",
  AbortQuery = "abort-query",
  InvalidQuery = "invalid-query",

  LDFetchGet = "ldfetch-get",

  Warning = "warning",

  ConnectionPrefetch = "connection-prefetch",

  ConnectionScan = "connection-scan",
  InitialReachableStops = "initial-reachable-stops",
  FinalReachableStops = "final-reachable-stops",
  AddedNewTransferProfile = "added-new-transfer-profile",
}

export default EventType;
