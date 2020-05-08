import DatasetDistribution from "./dataset_distribution";
import { Derivation } from "./derivation";

export class Dataset {
    public static create(id: string) {
        return new Dataset(id);
    }

    public id: string;
    public subject: string;
    public description: string;
    public title: string;
    public area: string;
    public rights: string;
    public distributions: DatasetDistribution[];
    public derivations: Derivation[];
    public baseDataUrl: string;

    constructor(id: string) {
        this.id = id;
    }
}
