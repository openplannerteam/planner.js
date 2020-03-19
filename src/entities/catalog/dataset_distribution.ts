export default class DatasetDistribution {
    public static create(id: string) {
        return new DatasetDistribution(id);
    }

    public id: string;
    public accessUrl: string;
    public mediatypes: string[];

    constructor(id: string) {
        this.id = id;
    }
}
