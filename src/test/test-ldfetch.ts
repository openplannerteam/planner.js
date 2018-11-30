import LDFetch from "ldfetch";
import Rdf from "../util/Rdf";

const ldfetch = new LDFetch({ headers: { Accept: "application/ld+json" } });

// ldfetch.get("http://irail.be/stations/NMBS/008896008")
ldfetch.get("https://openplanner.ilabt.imec.be/delijn/Limburg/stops")
  .then((response) => {
    Rdf.logTripleTable(response.triples);
  })
  .catch((reason) => {
    console.log(reason);
  });
