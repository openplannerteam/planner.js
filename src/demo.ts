import Planner from "./index";
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
    from: "http://irail.be/stations/NMBS/008896925", // Ingelmunster
    to: "http://irail.be/stations/NMBS/008892007", // Ghent-Sint-Pieters
    minimumDepartureTime: new Date(),
    maximumTransferDuration: Units.fromHours(.5),
  });

  console.timeEnd("Public transport planner");

  let i = 0;

  publicTransportResult.on("readable", () => {
    let path = publicTransportResult.read();

    while (path && i < 20) {
      console.log(i++, path);

      path = publicTransportResult.read();
    }
  });

  publicTransportResult.each((path) => {
    if (logResults) {
      console.log(path);
    }
  });

  return true;
};
