import DatasetDistribution from "./dataset_distribution";

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

    constructor(id: string) {
        this.id = id;
    }
}
