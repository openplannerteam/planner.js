enum EventType {
  Query = "query",
  QueryExponential = "query-exponential",
  QueryAbort = "query-abort",
  LDFetchGet = "ldfetch-get",
  ConnectionScan = "connection-scan",
  FinalReachableStops = "final-reachable-stops",
  InitialReachableStops = "initial-reachable-stops",
  AddedNewTransferProfile = "added-new-transfer-profile",
}

export default EventType;
