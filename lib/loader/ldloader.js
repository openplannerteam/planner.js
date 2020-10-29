"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const inversify_1 = require("inversify");
const parse = require("wellknown");
const constants_1 = require("../uri/constants");
const uri_1 = __importDefault(require("../uri/uri"));
let LDLoader = class LDLoader {
    constructor() {
        this.collectionFields = new Set();
    }
    defineCollection(field) {
        this.collectionFields.add(field);
    }
    process(triples, views) {
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
    disambiguateBlankNodes(triples, scope) {
        for (const triple of triples) {
            if (triple.subject.termType === "BlankNode") {
                triple.subject.value = `${scope}#${triple.subject.value}`;
            }
            if (triple.object.termType === "BlankNode") {
                triple.object.value = `${scope}#${triple.object.value}`;
            }
        }
    }
    _parseValue(entities, triple) {
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
            if (valueType === uri_1.default.inNS(constants_1.XMLS, "string")) {
                return rawValue;
            }
            if (valueType === uri_1.default.inNS(constants_1.XMLS, "boolean")) {
                return rawValue === "true";
            }
            if (valueType === uri_1.default.inNS(constants_1.XMLS, "double")) {
                return parseFloat(rawValue);
            }
            if (valueType === uri_1.default.inNS(constants_1.XMLS, "integer")) {
                return parseInt(rawValue, 10);
            }
            if (valueType === uri_1.default.inNS(constants_1.GEOSPARQL, "wktLiteral")) {
                return this.parseWktLiteral(rawValue);
            }
        }
        return rawValue;
    }
    parseWktLiteral(raw) {
        const [reference, ...rest] = raw.split(" ");
        if (reference === "<http://www.opengis.net/def/crs/OGC/1.3/CRS84>") {
            return parse(rest.join(" "));
        }
        return parse(raw);
    }
    _extractEntities(triples) {
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
            }
            else {
                const fieldData = entity[predicate] || [];
                fieldData.push(parsedValue);
                entity[predicate] = fieldData;
            }
        }
        return entities;
    }
};
LDLoader = __decorate([
    inversify_1.injectable()
], LDLoader);
exports.LDLoader = LDLoader;
//# sourceMappingURL=ldloader.js.map