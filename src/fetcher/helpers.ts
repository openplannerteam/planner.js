import { Triple } from "rdf-js";

const matchesTriple = (subject: string, predicate: string, object: string) => (triple: Triple) => {
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

const transformPredicate = (transformMap: {[oldPredicate: string]: string}, triple: Triple) => {
  if (triple.predicate.value in transformMap) {
    triple.predicate.value = transformMap[triple.predicate.value];
  }
  return triple;
};

export {matchesTriple, transformPredicate};
