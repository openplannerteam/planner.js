import DatasetDistribution from "./dataset_distribution";
export declare class Dataset {
    static create(id: string): Dataset;
    id: string;
    subject: string;
    description: string;
    title: string;
    area: string;
    rights: string;
    distributions: DatasetDistribution[];
    constructor(id: string);
}
