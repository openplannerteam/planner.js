import "isomorphic-fetch";
import Dijkstra from "node-dijkstra";
import "reflect-metadata";
import t from "tiles-in-bbox";
import Planner from "./Planner";

export default Planner;
import EventType from "./events/EventType";
import getEventBus from "./events/util";
import IPath from "./interfaces/IPath";
import defaultContainer from "./inversify.config";
import Units from "./util/Units";

const planner = new Planner();

planner.prefetchStops();
planner.prefetchConnections();

let scannedPages = 0;
let scannedConnections = 0;

// let logFetch = true;

console.log(`${new Date()} Start prefetch`);

const eventBus = getEventBus();
eventBus
    .on(EventType.InvalidQuery, (error) => {
        console.log("InvalidQuery", error);
    })
    .on(EventType.AbortQuery, (reason) => {
        console.log("AbortQuery", reason);
    })
    .on(EventType.Query, (Query) => {
        console.log("Query", Query);
    })
    .on(EventType.SubQuery, (query) => {
        const { minimumDepartureTime, maximumArrivalTime } = query;

        // logFetch = true;

        console.log("Total scanned pages", scannedPages);
        console.log("Total scanned connections", scannedConnections);
        console.log("[Subquery]", minimumDepartureTime, maximumArrivalTime, maximumArrivalTime - minimumDepartureTime);
    })
    .on(EventType.LDFetchGet, (url, duration) => {
        scannedPages++;
        console.log(`[GET] ${url} (${duration}ms)`);

        // if (logFetch) {
        //   console.log(`[GET] ${url} (${duration}ms)`);
        //   logFetch = false;
        // }
    })
    .on(EventType.ConnectionScan, (connection) => {
        scannedConnections++;
    })
    .on(EventType.Warning, (e) => {
        console.warn(e);
    });

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

wait(5000)
    .then(() => new Promise((resolve, reject) => {
        console.log(`${new Date()} Start query`);

        const amount = 3;
        let i = 0;

        planner.query({
            publicTransportOnly: true,
            // from: "https://data.delijn.be/stops/201657",
            // to: "https://data.delijn.be/stops/205910",
            // from: "https://data.delijn.be/stops/200455", // Deinze weg op Grammene +456
            // to: "https://data.delijn.be/stops/502481", // Tielt Metaalconstructie Goossens
            // from: "https://data.delijn.be/stops/509927", // Tield Rameplein perron 1
            // to: "https://data.delijn.be/stops/200455", // Deinze weg op Grammene +456
            from: "Hasselt", // Ingelmunster
            to: "Kortrijk", // Ghent-Sint-Pieters
            minimumDepartureTime: new Date(),
            maximumTransferDuration: Units.fromMinutes(30),
        })
            .take(amount)
            .on("error", (error) => {
                console.log(error);
            })
            .on("data", (path: IPath) => {
                ++i;

                console.log(new Date());
                console.log(i);
                console.log(JSON.stringify(path, null, " "));
                console.log("\n");

            });
    }));
