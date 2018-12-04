import { Triple } from "rdf-js";
import UriTemplate from "uritemplate";
import TravelMode from "../../../TravelMode";
import Rdf from "../../../util/Rdf";
import ConnectionsPageParser from "./ConnectionsPageParser";
import IHydraPage from "./IHydraPage";

/**
 * Searches the given array of triples for hydra meta data, like the search template and next/previous page iris
 * Also allows getting the contained [[IHydraPage]], which holds an array of [[IConnection]]s
 */
export default class HydraPageParser {
  private readonly triples: Triple[];
  private readonly documentIri: string;

  constructor(triples: Triple[]) {
    this.triples = triples;
    this.documentIri = this.getDocumentIri();
  }

  public getPage(index: number, travelMode: TravelMode): IHydraPage {
    const connectionsParser = new ConnectionsPageParser(this.documentIri, this.triples);
    const connections = connectionsParser.getConnections(travelMode);

    return {
      index,
      documentIri: this.documentIri,
      connections,
    };
  }

  public getSearchTemplate(): UriTemplate {
    const searchTriple = this.triples.find(
      Rdf.matchesTriple(this.documentIri, "http://www.w3.org/ns/hydra/core#search", null),
    );

    const templateTriple = this.triples.find(
      Rdf.matchesTriple(searchTriple.object.value, "http://www.w3.org/ns/hydra/core#template", null),
    );

    const template = templateTriple.object.value;
    return UriTemplate.parse(template);
  }

  public getNextPageIri(): string {
    const nextPageTriple: Triple = this.triples.find(
      Rdf.matchesTriple(this.documentIri, "http://www.w3.org/ns/hydra/core#next", null),
    );

    if (nextPageTriple && nextPageTriple.object.value.substr(0, 4) === "http") {
      return nextPageTriple.object.value;
    }
  }

  public getPreviousPageIri(): string {
    const previousPageTriple: Triple = this.triples.find(
      Rdf.matchesTriple(this.documentIri, "http://www.w3.org/ns/hydra/core#previous", null),
    );

    if (previousPageTriple && previousPageTriple.object.value.substr(0, 4) === "http") {
      return previousPageTriple.object.value;
    }
  }

  private getDocumentIri(): string {
    const typeTriple = this.triples.find(
      Rdf.matchesTriple(
        null,
        "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        "http://www.w3.org/ns/hydra/core#PartialCollectionView",
      ),
    );

    if (!typeTriple) {
      throw new Error("Hydra page doesn`t have type triple");
    }

    return typeTriple.subject.value;
  }
}
