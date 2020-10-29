import LDFetchBase from "ldfetch";
import { Triple } from "rdf-js";
export interface ILDFetchResponse {
    triples: Triple[];
    prefixes: object;
    statusCode: string;
    url: string;
}
/**
 * Proxies an ldfetch instance to transform its events
 */
export default class LDFetch implements LDFetchBase {
    private eventBus;
    private ldFetchBase;
    private httpStartTimes;
    constructor();
    get(url: string): Promise<ILDFetchResponse>;
    private setupEvents;
}
