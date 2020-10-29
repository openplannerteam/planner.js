export default class JSONLDContext {
    private rawData;
    private aliases;
    constructor(blob: object);
    resolveIdentifier(name: string): string;
    private processObject;
    private expandURI;
    private processArray;
}
