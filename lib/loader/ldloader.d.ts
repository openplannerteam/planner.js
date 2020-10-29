import { Triple } from "rdf-js";
import { ThingView } from "./views/single";
export declare class LDLoader {
    private collectionFields;
    defineCollection(field: string): void;
    process(triples: Triple[], views: Array<ThingView<any>>): any[];
    disambiguateBlankNodes(triples: any, scope: string): void;
    private _parseValue;
    private parseWktLiteral;
    private _extractEntities;
}
