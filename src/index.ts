import "isomorphic-fetch";
import "reflect-metadata";
import Planner from "./Planner";

const planner = new Planner();

(async () => {

  const roadOnlyResult = await planner.query({
    roadOnly: true,
    from: "http://irail.be/stations/NMBS/008896008", // Kortrijk
    to: "http://irail.be/stations/NMBS/008892007", // Ghent-Sint-Pieters
  });

  console.log(JSON.stringify(roadOnlyResult, null, "  "));

  const publicTransportResult = await planner.query({
    publicTransportOnly: true,
    from: "http://irail.be/stations/NMBS/008896008", // Kortrijk
    to: "http://irail.be/stations/NMBS/008892007", // Ghent-Sint-Pieters
  });

  console.log(JSON.stringify(publicTransportResult, null, "  "));

})();
