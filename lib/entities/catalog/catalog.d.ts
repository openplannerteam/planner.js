import { Dataset } from "./dataset";
export declare class Catalog {
    static create(id: string): Catalog;
    id: string;
    datasets: Dataset[];
    publisher: any;
    constructor(id: string);
}
