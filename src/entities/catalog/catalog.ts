import { Dataset } from "./dataset";

export class Catalog {
    public static create(id: string) {
        return new Catalog(id);
    }

    public id: string;
    public datasets: Dataset[];
    public publisher: any;

    constructor(id: string) {
        this.id = id;
    }
}
