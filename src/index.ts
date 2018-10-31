import "isomorphic-fetch";
import "reflect-metadata";
import Planner from "./Planner";

const planner = new Planner();

(async () => {

  const result = await planner.query({
    roadOnly: true,
    from: "http://irail.be/stations/NMBS/008896008", // Kortrijk
    to: "http://irail.be/stations/NMBS/008892007", // Ghent-Sint-Pieters
  });

  console.log(JSON.stringify(result, null, "  "));

})();
