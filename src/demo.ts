import Planner from "./index";
import IPath from "./interfaces/IPath";
import IStep from "./interfaces/IStep";
import Units from "./util/Units";

export default async (logResults) => {

  const planner = new Planner();

  // const roadOnlyResult = await planner.query({
  //  roadOnly: true,
  //  from: "http://irail.be/stations/NMBS/008896008", // Kortrijk
  //  to: "http://irail.be/stations/NMBS/008892007", // Ghent-Sint-Pieters
  // });
//
  // roadOnlyResult.each((path) => {
  //  if (logResults) {
  //    console.log(path);
  //  }
  // });

  console.time("Public transport planner");

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

  console.timeEnd("Public transport planner");

  let i = 0;

  publicTransportResult.take(3).on("data", (path: IPath) => {
    console.log(++i);
    path.steps.forEach((step: IStep) => {
      console.log(JSON.stringify(step, null, " "));
    });
    console.log("\n");
  });

  return true;
};
