import Planner from "./index";
import Units from "./util/Units";

const planner = new Planner();

export default async () => {

  const roadOnlyResult = await planner.query({
    roadOnly: true,
    from: "http://irail.be/stations/NMBS/008896008", // Kortrijk
    to: "http://irail.be/stations/NMBS/008892007", // Ghent-Sint-Pieters
  });

  console.log(JSON.stringify(roadOnlyResult, null, "  "));

  console.time("Public transport planner");

  const publicTransportResult = await planner.query({
    publicTransportOnly: true,
    from: "http://irail.be/stations/NMBS/008896925", // Ingelmunster
    to: "http://irail.be/stations/NMBS/008892007", // Ghent-Sint-Pieters
    minimumDepartureTime: new Date(),
    maximumTransferDuration: Units.fromHours(.5),
  });

  console.timeEnd("Public transport planner");
  console.log(publicTransportResult.paths.length);
  console.log(publicTransportResult);

  return true;
};
