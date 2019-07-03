export class HydraTemplate {
    public static create(id?: string) {
        return new HydraTemplate(id);
    }

    public id?: string;

    constructor(id?: string) {
        this.id = id;
    }
}
