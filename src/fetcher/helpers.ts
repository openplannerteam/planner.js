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

const transformObject = (transformMap: {[oldObject: string]: string}, triple: Triple) => {
  if (triple.object.value in transformMap) {
    triple.object.value = transformMap[triple.object.value];
  }
  return triple;
};

const logTripleTable = (triples: Triple[]) => {
  console.table(triples.map((triple: Triple) => ({
    subject: triple.subject.value,
    predicate: triple.predicate.value,
    object: triple.object.value,
  })));
};

export {matchesTriple, transformPredicate, transformObject, logTripleTable};
