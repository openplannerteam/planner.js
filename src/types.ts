import TravelMode from "./enums/TravelMode";
import IConnectionsFetcher from "./fetcher/connections/IConnectionsFetcher";
import IStopsFetcher from "./fetcher/stops/IStopsFetcher";
import IRoutableTileFetcher from "./fetcher/tiles/IRoutableTilesFetcher";

const TYPES = {
  Context: Symbol("Context"),
  QueryRunner: Symbol("QueryRunner"),
  LocationResolver: Symbol("LocationResolver"),

  ConnectionsProvider: Symbol("ConnectionsProvider"),
  ConnectionsFetcher: Symbol("ConnectionsFetcher"),
  ConnectionsFetcherFactory: Symbol("ConnectionsFetcherFactory"),

  StopsProvider: Symbol("StopsProvider"),
  StopsFetcher: Symbol("StopsFetcher"),
  StopsFetcherFactory: Symbol("StopsFetcherFactory"),

  RoutableTilesProvider: Symbol("TilesProvider"),
  RoutableTilesFetcher: Symbol("TilesFetcher"),
  RoutableTilesFetcherFactory: Symbol("TilesFetcherFactory"),

  PublicTransportPlanner: Symbol("PublicTransportPlanner"),
  PublicTransportPlannerFactory: Symbol("PublicTransportPlannerFactory"),

  RoadPlanner: Symbol("RoadPlanner"),
  RoadPlannerFactory: Symbol("RoadPlannerFactory"),

  ReachableStopsFinder: Symbol("ReachableStopsFinder"),
  JourneyExtractor: Symbol("JourneyExtractor"),
  LDFetch: Symbol("LDFetch"),
  LDLoader: Symbol("LDLoader"),
  Catalog: Symbol("Catalog"),
};

export default TYPES;

export type StopsFetcherFactory = (accessUrl: string) => IStopsFetcher;
export type ConnectionsFetcherFactory = (accessUrl: string, travelMode: TravelMode) => IConnectionsFetcher;
export type RoutableTilesFetcherFactory = (accesUrl: string) => IRoutableTileFetcher;
