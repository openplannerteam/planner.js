import "isomorphic-fetch";
import "reflect-metadata";

// classes
import IsochroneGenerator from "./analytics/isochrones/main";
import TrafficEstimator from "./analytics/traffic/main";

// functions
import createPlanner from "./create";
import classifyDataSource from "./data/classify";

// instances
import RoutableTileRegistry_ from "./entities/tiles/registry";
import EventBus_ from "./events/EventBus";

// enums
import DataType from "./data/Datatypes";
import TravelMode from "./enums/TravelMode";
import EventType from "./events/EventType";
import QueryMode from "./QueryMode";
import Units from "./util/Units";

//
// EXPORTS
//

// planners
import DissectPlanner from "./planner/configurations/DissectPlanner";
import FlexibleProfileTransitPlanner from "./planner/configurations/FlexibleProfileTransitPlanner";
import FlexibleRoadPlanner from "./planner/configurations/FlexibleRoadPlanner";
import FlexibleTransitPlanner from "./planner/configurations/FlexibleTransitPlanner";
import GeospatialFragmentedPlanner from "./planner/configurations/GeospatialFragmentedPlanner";
import ReducedCarPlanner from "./planner/configurations/ReducedCarPlanner";
import TriangleTransitPlanner from "./planner/configurations/TriangleTransitPlanner";
import RoadPlannerPathfinding from "./planner/road/RoadPlannerPathfinding";
import PathfinderProvider from "./pathfinding/PathfinderProvider";
import LDFetch from "./fetcher/LDFetch";
import RoutableTileProviderDefault from "./fetcher/tiles/RoutableTileProviderDefault";
import RoutableTileFetcherRaw from "./fetcher/tiles/RoutableTileFetcherRaw";
import DijkstraTree from "./pathfinding/dijkstra-tree/DijkstraTree";
import { Dijkstra } from "./pathfinding/dijkstra/Dijkstra";
import ProfileProviderDefault from "./fetcher/profiles/ProfileProviderDefault";
import ProfileFetcherDefault from "./fetcher/profiles/ProfileFetcherDefault";
import LocationResolverDefault from "./query-runner/LocationResolverDefault";
import StopsProviderDefault from "./fetcher/stops/StopsProviderDefault";
import StopsFetcherLDFetch from "./fetcher/stops/ld-fetch/StopsFetcherLDFetch";
import TransitTileFetcherRaw from "./fetcher/tiles/TransitTileFetcherRaw";
import { classifyDataSet } from "./data/classify";

// classes
export { default as IsochroneGenerator } from "./analytics/isochrones/main";
export { default as TrafficEstimator } from "./analytics/traffic/main";

// functions
export { default as createPlanner } from "./create";
export { default as classifyDataSource } from "./data/classify";

// instances
export const EventBus = EventBus_.getInstance();
export const RoutableTileRegistry = RoutableTileRegistry_.getInstance();

// enums
export { default as DataType } from "./data/Datatypes";
export { default as TravelMode } from "./enums/TravelMode";
export { default as EventType } from "./events/EventType";
export { default as QueryMode } from "./QueryMode";
export { default as Units } from "./util/Units";

// planners
export { default as DissectPlanner } from "./planner/configurations/DissectPlanner";
export { default as FlexibleProfileTransitPlanner } from "./planner/configurations/FlexibleProfileTransitPlanner";
export { default as FlexibleRoadPlanner } from "./planner/configurations/FlexibleRoadPlanner";
export { default as FlexibleTransitPlanner } from "./planner/configurations/FlexibleTransitPlanner";
export { default as GeospatialFragmentedPlanner } from "./planner/configurations/GeospatialFragmentedPlanner";
export { default as ReducedCarPlanner } from "./planner/configurations/ReducedCarPlanner";
export { default as TriangleTransitPlanner } from "./planner/configurations/TriangleTransitPlanner";

export default {
    // classes
    IsochroneGenerator,
    TrafficEstimator,

    // functions
    classifyDataSource,
    createPlanner,

    // instances
    RoutableTileRegistry,
    EventBus,

    // enums
    TravelMode,
    EventType,
    Units,
    QueryMode,
    DataType,

    // planners
    DissectPlanner,
    FlexibleProfileTransitPlanner,
    FlexibleRoadPlanner,
    FlexibleTransitPlanner,
    GeospatialFragmentedPlanner, // experimental
    ReducedCarPlanner,
    TriangleTransitPlanner,
};

import defaultContainer from "./configs/reduced_car";
import TYPES from "./types";
import TransitTileProviderDefault from "./fetcher/tiles/SmartTileProvider";
import ITransitTileProvider from "./fetcher/tiles/ISmartTileProvider";
import { RoutableTileCoordinate } from "./entities/tiles/coordinate";
import RoadPlannerPathfindingExperimental from "./planner/road/RoadPlannerPathfindingExperimental";
import IRoadPlanner from "./planner/road/IRoadPlanner";
import { RoutableTileNode } from "./entities/tiles/node";
import ICatalogProvider from "./fetcher/catalog/ICatalogProvider";
import ICatalogFetcher from "./fetcher/catalog/ICatalogFetcher";
import { Catalog } from "./entities/catalog/catalog";


//INFO: this piece of code uses LDFetch to fetch transit data and transform them to Triples
// const fetcher = new LDFetch();

// fetcher.get("http://192.168.56.1:8080/car/transit/14/8294/5481.json").then(
//     (resp) => {
//         for(const triple of resp.triples){
//             if(triple.object.value === "https://w3id.org/tree#GeospatiallyContainsRelation"){
//                 console.log(triple.object.value);
//             }
//         }
//     });

//INFO: this piece of code tests the TRANSITTILEFETCHER

const container = defaultContainer;
const pathfindingProvider = container.get<PathfinderProvider>(TYPES.PathfinderProvider);
const transitTileFetcher = new TransitTileFetcherRaw(pathfindingProvider);

//  transitTileFetcher.get("http://192.168.56.1:8080/car/transit/14/8294/5481.json").then(
//      (resp) =>{
//          console.log(resp);
//      }
//  );

// // INFO: this piece of code tests the TRANSITTILEPROVIDERDEFAULT

const transitTileProvider = container.get<ITransitTileProvider>(TYPES.TransitTileProvider);
// from: [{ latitude: 50.93278, longitude: 5.32665 }], // Pita Aladin, Hasselt
// //     to: [{ latitude: 50.7980187, longitude: 3.1877779 }], // Burger Pita Pasta, Menen

// let startNode = new RoutableTileNode("start");
// let stopNode = new RoutableTileNode("stop");

// let testNode = new RoutableTileNode("test");

// POINT(4.1877779 50.8080187) ergens links van Brussel
// POINT(5.2 50.85)

// testNode.longitude = 5.325;
// testNode.latitude = 50.9325;

// startNode.longitude = 5.32665;
// startNode.latitude = 50.93278;

// stopNode.longitude = 3.1877779;
// stopNode.latitude = 50.7980187;

// transitTileProvider.addLocalNodes([startNode, stopNode]);

// transitTileProvider.traverseTransitTree(testNode).then( resp => {
//     console.log(resp);
//     transitTileProvider.getTileFromCache("http://192.168.56.1:8080/tiles/car/transit/12/2108/1372.json").then(resp2 => {
//         console.log(resp2);
//     }).catch(err =>{
//         console.log(err);
//     })
// })




// transitTileProvider.getByTileCoords(new RoutableTileCoordinate(14, 8294, 5488)).then(
//     (resp) => {
//         console.log(resp);
//     }
// )

// function tile_to_lat(coordinate) {
//     // from https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
//     const n = Math.PI - 2 * Math.PI * coordinate.y / Math.pow(2, coordinate.zoom);
//     return (180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
// }

// function tile_to_long(coordinate) {
//     // from https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
//     return (coordinate.x / Math.pow(2, coordinate.zoom) * 360 - 180);
// }

// let coordinate = new RoutableTileCoordinate(8, 129, 84);
// let coordinateRight = new RoutableTileCoordinate(8, 133, 84);
// let coordinateUnder = new RoutableTileCoordinate(8, 129, 88);
// let coordinateRightUnder = new RoutableTileCoordinate(8, 133, 88);

// console.log("Longitude tile final: " + tile_to_long(coordinate));
// console.log("Latitude tile final: " + tile_to_lat(coordinate));

// console.log("Longitude rightTile: " + tile_to_long(coordinateRight));
// console.log("Latitude rightTile: " + tile_to_lat(coordinateRight));

// console.log("Longitude underTile: " + tile_to_long(coordinateRightUnder));
// console.log("Latitude underTile: " + tile_to_lat(coordinateRightUnder));

// console.log("Longitude rightUnderTile: " + tile_to_long(coordinateUnder));
// console.log("Latitude rightUnderTile: " + tile_to_lat(coordinateUnder));



// import parse = require("wellknown");

// const raw = "<http://www.opengis.net/def/crs/OGC/1.3/CRS84> Point(2.2571926 51.0416114)";

// const [reference, ...rest] = raw.split(" ");
// if (reference === "<http://www.opengis.net/def/crs/OGC/1.3/CRS84>") {
//     const obj = parse(rest.join(" "));
//     console.log(obj.coordinates[0]);
//     console.log(obj.coordinates[1]);
// }
// console.log(parse(raw));





// // TEST PLANNER

const planner = container.get<IRoadPlanner>(TYPES.RoadPlanner);

const start = new Date();
const startTime = start.getTime();



planner.plan({
    profileID: "https://hdelva.be/profile/car",
    from: [{ latitude: 50.93278, longitude: 5.32665 }], // Pita Aladin, Hasselt
    to: [{ latitude: 50.7980187, longitude: 3.1877779 }], // Burger Pita Pasta, Menen
}).then(
    (resp) => {
        //console.log(resp);
        resp.each((path) => {
            for (let leg of path.legs) {

                const stop = new Date();
                const stopTime = stop.getTime();
                console.log(stopTime-startTime);
                console.log(leg.getSteps().length);
                for (let step of leg.getSteps()) {
                    //console.log("startLocation: " + step.startLocation.latitude + "-" + step.startLocation.longitude + " , stoplocation: " + step.stopLocation.latitude + "-" + step.stopLocation.longitude);
                }
                //console.log(leg.getSteps()[0].duration);
            }
        })
    }
)

// const catalogProvider = container.get<ICatalogProvider>(TYPES.CatalogProvider);
// const catalogFetcher = container.get<ICatalogFetcher>(TYPES.CatalogFetcher);

// catalogFetcher.get("http://192.168.56.1:8080/tiles/catalog_v2.json").then( resp => {

//     for(const dataset of resp.datasets){
//         console.log(classifyDataSet(dataset));
//     }

// });

// catalogProvider.getCatalog("http://192.168.56.1:8080/tiles/catalog_v2.json").then(catalog => {


//     console.log(catalog.id);
//     for (const set of catalog.datasets) {
//         console.log(set.id);
//     }
// });