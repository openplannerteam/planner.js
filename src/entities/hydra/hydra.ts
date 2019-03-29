export class HydraEntity {
    public static create(id) {
        return new HydraEntity(id);
    }

    public id: string;

    constructor(id: string) {
        this.id = id;
    }
}
