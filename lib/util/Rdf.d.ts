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
    static matchesTriple(subject: string | null, predicate: string | null, object: string | null): (triple: Triple) => boolean;
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
    static transformPredicate(transformMap: {
        [oldPredicate: string]: string;
    }, triple: Triple): Triple;
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
    static transformObject(transformMap: {
        [oldObject: string]: string;
    }, triple: Triple): Triple;
    /**
     * Log an array of triples to the console as a table with three columns: subject, predicate and object
     */
    static logTripleTable(triples: Triple[]): void;
}
