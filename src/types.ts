import TravelMode from "./enums/TravelMode";
import IConnectionsFetcher from "./fetcher/connections/IConnectionsFetcher";
import IStopsFetcher from "./fetcher/stops/IStopsFetcher";
import IHypermediaTreeFetcher from "./fetcher/tree/IHypermediaTreeFetcher";

const TYPES = {
  EventBus: Symbol("EventBus"),
  Context: Symbol("Context"),
  QueryRunner: Symbol("QueryRunner"),
  LocationResolver: Symbol("LocationResolver"),

  HydraTemplateFetcher: Symbol("HydraTemplateFetcher"),
  HypermediaTreeFetcher: Symbol("HypermediaTreeFetcher"),
  HypermediaTreeProvider: Symbol("HypermediaTreeProvider"),
  HypermediaTreeFetcherFactory: Symbol("HypermediaTreeFetcherFactory"),

  CatalogFetcher: Symbol("CatalogFetcher"),
  CatalogProvider: Symbol("CatalogProvider"),

  ConnectionsProvider: Symbol("ConnectionsProvider"),
  ConnectionsFetcher: Symbol("ConnectionsFetcher"),
  ConnectionsFetcherFactory: Symbol("ConnectionsFetcherFactory"),

  StopsProvider: Symbol("StopsProvider"),
  StopsFetcher: Symbol("StopsFetcher"),
  StopsFetcherFactory: Symbol("StopsFetcherFactory"),

  RoutableTileProvider: Symbol("TileProvider"),
  RoutableTileFetcher: Symbol("TileFetcher"),

  FootpathsProvider: Symbol("FootpathsProvider"),

  PublicTransportPlanner: Symbol("PublicTransportPlanner"),
  PublicTransportPlannerFactory: Symbol("PublicTransportPlannerFactory"),

  ProfileFetcher: Symbol("ProfileFetcher"),
  ProfileProvider: Symbol("ProfileProvider"),
  RoadPlanner: Symbol("RoadPlanner"),
  RoadPlannerFactory: Symbol("RoadPlannerFactory"),
  PathfinderProvider: Symbol("PathfinderProvider"),
  ShortestPathAlgorithm: Symbol("ShortestPathAlgorithm"),
  ShortestPathTreeAlgorithm: Symbol("ShortestPathTreeAlgorithm"),

  ReachableStopsFinder: Symbol("ReachableStopsFinder"),
  JourneyExtractor: Symbol("JourneyExtractor"),
  LDFetch: Symbol("LDFetch"),
  LDLoader: Symbol("LDLoader"),
};

export default TYPES;

export type HypermediaTreeFetcherFactory = (accessUrl: string) => IHypermediaTreeFetcher;
export type StopsFetcherFactory = (accessUrl: string) => IStopsFetcher;
export type ConnectionsFetcherFactory = (travelMode: TravelMode) => IConnectionsFetcher;
