import LDFetch from "ldfetch";
import Rdf from "../util/Rdf";

const ldfetch = new LDFetch({ headers: { Accept: "application/ld+json" } });

// ldfetch.get("http://irail.be/stations/NMBS/008896008")
ldfetch.get("https://belgium.linkedconnections.org/delijn/Oost-Vlaanderen/stops")
  .then((response) => {
    Rdf.logTripleTable(response.triples);
  })
  .catch((reason) => {
    console.log(reason);
  });
