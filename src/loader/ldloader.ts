import { injectable } from "inversify";
import { Triple } from "rdf-js";
import parse = require("wellknown");
import { GEOSPARQL, XMLS } from "../uri/constants";
import URI from "../uri/uri";
import { IEntity, IEntityMap } from "./common";
import { ThingView } from "./views/single";

@injectable()
export class LDLoader {

    private collectionFields: Set<string> = new Set();

    public defineCollection(field: string) {
        this.collectionFields.add(field);
    }

    public process(triples: Triple[], views: Array<ThingView<any>>) {
        const entities = this._extractEntities(triples);

        for (const entity of Object.values(entities)) {
            for (const view of views) {
                const mapped = view.process(entity);
                if (mapped) {
                    view.addEntity(mapped);
                }
            }
        }

        return views.map((view) => view.getContents());
    }

    public disambiguateBlankNodes(triples, scope: string) {
        for (const triple of triples) {
            if (triple.subject.termType === "BlankNode") {
                triple.subject.value = `${scope}#${triple.subject.value}`;
            }
            if (triple.object.termType === "BlankNode") {
                triple.object.value = `${scope}#${triple.object.value}`;
            }
        }
    }

    private _parseValue(entities, triple) {
        const tripleObject = triple.object;
        const rawValue = tripleObject.value;
        if (tripleObject.termType === "BlankNode") {
            return entities[rawValue];
        }
        if (tripleObject.termType === "NamedNode") {
            if (entities[rawValue]) {
                return entities[rawValue];
            }
        }
        if (tripleObject.termType === "Literal") {
            const valueType = tripleObject.datatype.value;
            if (valueType === URI.inNS(XMLS, "string")) {
                return rawValue;
            }
            if (valueType === URI.inNS(XMLS, "boolean")) {
                return rawValue === "true";
            }
            if (valueType === URI.inNS(XMLS, "double")) {
                return parseFloat(rawValue);
            }
            if (valueType === URI.inNS(XMLS, "integer")) {
                return parseInt(rawValue, 10);
            }
            if (valueType === URI.inNS(GEOSPARQL, "wktLiteral")) {
                return this.parseWktLiteral(rawValue);
            }
        }

        return rawValue;
    }

    private parseWktLiteral(raw: string) {
        const [reference, ...rest] = raw.split(" ");
        if (reference === "<http://www.opengis.net/def/crs/OGC/1.3/CRS84>") {
            return parse(rest.join(" "));
        }
        return parse(raw);
    }

    private _extractEntities(triples): IEntityMap<IEntity> {
        const entities = {};
        for (const triple of triples) {
            const { subject: { value: subject } } = triple;

            if (!(subject in entities)) {
                entities[subject] = { id: subject };
            }
        }
        for (const triple of triples) {
            const { subject: { value: subject }, predicate: { value: predicate } } = triple;

            const entity = entities[subject];
            const parsedValue = this._parseValue(entities, triple);

            if (!this.collectionFields.has(predicate)) {
                entity[predicate] = parsedValue;
            } else {
                const fieldData = entity[predicate] || [];
                fieldData.push(parsedValue);
                entity[predicate] = fieldData;
            }

        }
        return entities;
    }
}
