import {
    DataType,
    FlexibleProfileTransitPlanner,
    FlexibleTransitPlanner,
    QueryMode,
    ReducedCarPlanner,
    TriangleTransitPlanner,
} from ".";
import IDataSource from "./data/IDataSource";
import FlexibleRoadPlanner from "./planner/configurations/FlexibleRoadPlanner";
import Planner from "./planner/configurations/Planner";

/*
 * Factory method for Planner configurations
 * Picks the most appropriate configuration for the given data sources / query mode
 *
 * !! Due to hypermedia issues none of the tiled data sources are configurable right now
 */
export default function createPlanner(sources: IDataSource[], queryMode: QueryMode): Planner {
    const connectionSources: IDataSource[] = [];
    const stopSources: IDataSource[] = [];
    const reducedTileSources: IDataSource[] = [];
    const footpathSources: IDataSource[] = [];

    for (const source of sources) {
        if (source.datatype === DataType.Connections) {
            connectionSources.push(source);
        } else if (source.datatype === DataType.Stops) {
            stopSources.push(source);
        } else if (source.datatype === DataType.ReducedRoutableTile) {
            reducedTileSources.push(source);
        } else if (source.datatype === DataType.Footpath) {
            footpathSources.push(source);
        }
    }

    let planner: Planner;
    if (queryMode === QueryMode.Dijkstra) {
        if (reducedTileSources.length > 0) {
            planner = new ReducedCarPlanner();
        } else {
            planner = new FlexibleRoadPlanner();
        }
    } else {
        if (queryMode === QueryMode.CSAEarliestArrival) {
            if (footpathSources.length > 0) {
                planner = new TriangleTransitPlanner();
            } else {
                planner = new FlexibleTransitPlanner();
            }
        } else {
            planner = new FlexibleProfileTransitPlanner();
        }

        for (const connectionSource of connectionSources) {
            planner.addConnectionSource(connectionSource.accessUrl);
        }

        for (const stopSource of stopSources) {
            planner.addStopSource(stopSource.accessUrl);
        }
    }

    return planner;
}
