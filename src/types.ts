const TYPES = {
  Context: Symbol("Context"),
  QueryRunner: Symbol("QueryRunner"),
  LocationResolver: Symbol("LocationResolver"),
  ConnectionsFetcher: Symbol("ConnectionsFetcher"),
  StopsFetcher: Symbol("StopsFetcher"),
  StopsFetcherMediator: Symbol("StopsFetcherMediator"),
  PublicTransportPlanner: Symbol("PublicTransportPlanner"),
  RoadPlanner: Symbol("RoadPlanner"),
  ReachableStopsFinder: Symbol("ReachableStopsFinder"),
  JourneyExtractor: Symbol("JourneyExtractor"),
};

export default TYPES;
