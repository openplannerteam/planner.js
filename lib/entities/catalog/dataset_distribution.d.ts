export default class DatasetDistribution {
    static create(id: string): DatasetDistribution;
    id: string;
    accessUrl: string;
    mediatypes: string[];
    constructor(id: string);
}
