import { Triple } from "rdf-js";

export default class Rdf {

  public static matchesTriple(subject: string, predicate: string, object: string): (triple: Triple) => boolean {
    return (triple: Triple) => {
      if (subject && triple.subject.value !== subject) {
        return false;
      }

      if (predicate && triple.predicate.value !== predicate) {
        return false;
      }

      if (object && triple.object.value !== object) {
        return false;
      }

      return true;
    };
  }

  public static transformPredicate(transformMap: { [oldPredicate: string]: string }, triple: Triple): Triple {
    if (triple.predicate.value in transformMap) {
      triple.predicate.value = transformMap[triple.predicate.value];
    }
    return triple;
  }

  public static transformObject(transformMap: { [oldObject: string]: string }, triple: Triple): Triple {
    if (triple.object.value in transformMap) {
      triple.object.value = transformMap[triple.object.value];
    }
    return triple;
  }

  public static logTripleTable(triples: Triple[]): void {
    console.table(triples.map((triple: Triple) => ({
      subject: triple.subject.value,
      predicate: triple.predicate.value,
      object: triple.object.value,
    })));
  }
}
