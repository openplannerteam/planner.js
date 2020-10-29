"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Utility class with functions dealing with rdf triples
 */
class Rdf {
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
    static matchesTriple(subject, predicate, object) {
        return (triple) => {
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
    static transformPredicate(transformMap, triple) {
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
    static transformObject(transformMap, triple) {
        if (triple.object.value in transformMap) {
            triple.object.value = transformMap[triple.object.value];
        }
        return triple;
    }
    /**
     * Log an array of triples to the console as a table with three columns: subject, predicate and object
     */
    static logTripleTable(triples) {
        console.table(triples.map((triple) => ({
            subject: triple.subject.value,
            predicate: triple.predicate.value,
            object: triple.object.value,
        })));
    }
}
exports.default = Rdf;
//# sourceMappingURL=Rdf.js.map