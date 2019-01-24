import { Triple } from "rdf-js";

/**
 * Utility class with functions dealing with rdf triples
 */
export default class Rdf {

  /**
   * Creates a triple matcher callback function for use in e.g. an Array#filter() expression
   *
   * For example:
   * ```
   * tripleArray.filter(Rdf.matchesTriple('someSubject', null, null));
   * ```
   * @param subject can be null if not wanting to match by subject
   * @param predicate can be null if not wanting to match by predicate
   * @param object can be null if not wanting to match by object
   */
  public static matchesTriple(
    subject: string | null,
    predicate: string | null,
    object: string | null,
  ): (triple: Triple) => boolean {

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

  /**
   * Rename the predicate of a triple based on a map with original predicates as keys and
   * replacement predicates as values
   *
   * For example:
   * ```
   * const transformedTriple = Rdf.transformPredicate({
   *   "oldPredicate1": "newPredicate1",
   *   "oldPredicate2": "newPredicate2",
   * }, someTriple));
   * ```
   */
  public static transformPredicate(transformMap: { [oldPredicate: string]: string }, triple: Triple): Triple {
    if (triple.predicate.value in transformMap) {
      triple.predicate.value = transformMap[triple.predicate.value];
    }
    return triple;
  }

  /**
   * Rename the object of a triple based on a map with original objects as keys and
   * replacement objects as values
   *
   * For example:
   * ```
   * const transformedTriple = Rdf.transformObject({
   *   "oldObject1": "newObject1",
   *   "oldObject2": "newObject2",
   * }, someTriple));
   * ```
   */
  public static transformObject(transformMap: { [oldObject: string]: string }, triple: Triple): Triple {
    if (triple.object.value in transformMap) {
      triple.object.value = transformMap[triple.object.value];
    }
    return triple;
  }

  /**
   * Log an array of triples to the console as a table with three columns: subject, predicate and object
   */
  public static logTripleTable(triples: Triple[]): void {
    console.table(triples.map((triple: Triple) => ({
      subject: triple.subject.value,
      predicate: triple.predicate.value,
      object: triple.object.value,
    })));
  }
}
