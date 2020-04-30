export default class ZoiSubject {
    public id?: string;
    private property: string;
    private values: string[];

    constructor(id: string, property: string, values: string[]) {
        this.id = id;
        this.property = property;
        this.values = values;
    }

    public getProperty() {
        return this.property;
    }

    public getValues() {
        return this.values;
    }
}
