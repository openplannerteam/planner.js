import EventType from "./enums/EventType";
import Planner from "./index";
import IPath from "./interfaces/IPath";
import Units from "./util/Units";

export default async (logResults) => {

  const planner = new Planner();

  planner.prefetchStops();
  planner.prefetchConnections();

  if (logResults) {
    let scannedPages = 0;
    let scannedConnections = 0;

    // let logFetch = true;

    if (logResults) {
      console.log("Start prefetch");
    }

    planner
      .on(EventType.InvalidQuery, (error) => {
        console.log("InvalidQuery", error);
      })
      .on(EventType.AbortQuery, (reason) => {
        console.log("AbortQuery", reason);
      })
      .on(EventType.Query, (Query) => {
        console.log("Query", Query);
      })
      .on(EventType.QueryExponential, (query) => {
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
  }

  return wait(5000)
    .then(() => new Promise((resolve, reject) => {
      if (logResults) {
        console.log("Start query");
      }

      planner.query({
        publicTransportOnly: true,
        // from: "https://data.delijn.be/stops/201657",
        // to: "https://data.delijn.be/stops/205910",
        // from: "https://data.delijn.be/stops/200455", // Deinze weg op Grammene +456
        // to: "https://data.delijn.be/stops/502481", // Tielt Metaalconstructie Goossens
        // from: "https://data.delijn.be/stops/509927", // Tield Rameplein perron 1
        // to: "https://data.delijn.be/stops/200455", // Deinze weg op Grammene +456
        from: "Ingelmunster", // Ingelmunster
        to: "http://irail.be/stations/NMBS/008892007", // Ghent-Sint-Pieters
        minimumDepartureTime: new Date(),
        maximumTransferDuration: Units.fromHours(0.5),
      })
        .then((publicTransportResult) => {

          const amount = 3;
          let i = 0;

          publicTransportResult.take(amount)
            .on("data", (path: IPath) => {
              ++i;

              if (logResults) {
                console.log(i);
                console.log(JSON.stringify(path, null, " "));
                console.log("\n");
              }

            })
            .on("end", () => {
              if (i === amount) {
                resolve(true);
              } else {
                resolve(false);
              }
            });

        })
        .catch(() => {
          resolve(false);
        });
    }));

};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
