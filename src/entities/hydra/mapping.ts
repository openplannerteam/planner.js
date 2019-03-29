export class HydraTemplateMapping {
    public static create(id?: string) {
        return new HydraTemplateMapping(id);
    }

    public id?: string;

    constructor(id?: string) {
        this.id = id;
    }
}
