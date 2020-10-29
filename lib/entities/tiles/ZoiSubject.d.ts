export default class ZoiSubject {
    id?: string;
    private property;
    private values;
    constructor(id: string, property: string, values: string[]);
    getProperty(): string;
    getValues(): string[];
}
