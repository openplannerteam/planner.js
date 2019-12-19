export class HydraTemplateMapping {
    public static create(id?: string) {
        return new HydraTemplateMapping(id);
    }

    public id?: string;
    public variable: string;
    public required: boolean;
    public property: string;

    constructor(id?: string) {
        this.id = id;
    }
}
