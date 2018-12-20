import EventType from "./EventType";
import Planner from "./index";
import IPath from "./interfaces/IPath";
import IStep from "./interfaces/IStep";
import Units from "./util/Units";

export default async (logResults) => {

  const planner = new Planner();

  if (logResults) {
    planner
      .on(EventType.Query, (query) => {
        console.log("Query", query);
      })
      .on(EventType.QueryExponential, (query) => {
        const { minimumDepartureTime, maximumArrivalTime } = query;

        console.log("[Subquery]", minimumDepartureTime, maximumArrivalTime, maximumArrivalTime - minimumDepartureTime);
      })
      .on(EventType.LDFetchGet, (url, duration) => {
        console.log(`[GET] ${url} (${duration}ms)`);
      });
  }

  const publicTransportResult = await planner.query({
    publicTransportOnly: true,
    // from: "https://data.delijn.be/stops/201657",
    // to: "https://data.delijn.be/stops/205910",
    // from: "https://data.delijn.be/stops/200455", // Deinze weg op Grammene +456
    // to: "https://data.delijn.be/stops/502481", // Tielt Metaalconstructie Goossens
    // from: "https://data.delijn.be/stops/509927", // Tield Rameplein perron 1
    // to: "https://data.delijn.be/stops/200455", // Deinze weg op Grammene +456
    from: "http://irail.be/stations/NMBS/008896008", // Kortrijk
    to: "http://irail.be/stations/NMBS/008892007", // Ghent-Sint-Pieters
    minimumDepartureTime: new Date(),
    maximumTransferDuration: Units.fromHours(.01),
  });

  return new Promise((resolve, reject) => {
    let i = 0;

    publicTransportResult.take(3)
      .on("data", (path: IPath) => {
        ++i;

        if (logResults) {
          console.log(++i);
          path.steps.forEach((step: IStep) => {
            console.log(JSON.stringify(step, null, " "));
          });
          console.log("\n");
        }

        if (i === 3) {
          resolve(true);
        }
      });
  });
};
