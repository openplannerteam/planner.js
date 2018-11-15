const Planner = require('plannerjs').default;

const planner = new Planner();

planner.query({
  publicTransportOnly: true,
  from: "http://irail.be/stations/NMBS/008896925", // Ingelmunster
  to: "http://irail.be/stations/NMBS/008892007", // Ghent-Sint-Pieters
  minimumDepartureTime: new Date(),
  maximumTransferDuration: 30 * 60 * 1000, // 30 minutes
})
  .then((result) => {
    console.log(result);
  })
  .catch((reason) => {
    console.error(reason);
  });
