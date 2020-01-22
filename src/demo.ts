import { FlexibleProfileTransitPlanner } from ".";
import EventBus from "./events/EventBus";
import EventType from "./events/EventType";
import IPath from "./interfaces/IPath";
import Units from "./util/Units";

export default async (logResults) => {

  const planner = new FlexibleProfileTransitPlanner();
  planner.addConnectionSource("https://graph.irail.be/sncb/connections");
  planner.addStopSource("https://irail.be/stations/NMBS");

  if (logResults) {
    let scannedConnections = 0;

    const eventBus = EventBus.getInstance();

    // let logFetch = true;

    if (logResults) {
      console.log(`${new Date()} Start prefetch`);
    }

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

        console.log("Total scanned connections", scannedConnections);
        console.log("[Subquery]", minimumDepartureTime, maximumArrivalTime, maximumArrivalTime - minimumDepartureTime);
      })
      .on(EventType.ResourceFetch, (data) => {
        console.log(`[GET] ${JSON.stringify(data)}`);

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

  return new Promise((resolve, reject) => {
    if (logResults) {
      console.log(`${new Date()} Start query`);
    }

    const amount = 2;
    let i = 0;

    planner
      .setProfileID("https://hdelva.be/profile/pedestrian")
      .query({
        // roadNetworkOnly: true,
        // from: "https://data.delijn.be/stops/201657",
        // to: "https://data.delijn.be/stops/205910",
        // from: "https://data.delijn.be/stops/200455", // Deinze weg op Grammene +456
        // to: "https://data.delijn.be/stops/502481", // Tielt Metaalconstructie Goossens
        // from: "https://data.delijn.be/stops/509927", // Tield Rameplein perron 1
        // to: "https://data.delijn.be/stops/200455", // Deinze weg op Grammene +456
        // from: "Ingelmunster", // Ingelmunster
        // to: "http://irail.be/stations/NMBS/008892007", // Ghent-Sint-Pieters
        from: { latitude: 50.93278, longitude: 5.32665 }, // Pita Aladin, Hasselt
        to: { latitude: 50.7980187, longitude: 3.1877779 }, // Burger Pita Pasta, Menen
        // from: "Hasselt",
        // to: "Kortrijk",
        minimumDepartureTime: new Date(),
        maximumTransferDuration: Units.fromMinutes(30),
      })
      .take(amount)
      .on("data", (path: IPath) => {
        ++i;

        if (logResults) {
          console.log(new Date());
          console.log(i);
          console.log(JSON.stringify(path, null, " "));
          console.log("\n");
        }

        if (i === amount) {
          resolve(true);
        }
      })
      .on("end", () => {
        resolve(false);
      });
  });
};
