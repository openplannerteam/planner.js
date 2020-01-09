import HypermediaTreeRelation from "./relation";

export default class HypermediaTree {
    public static create(id?: string) {
        return new HypermediaTree(id);
    }

    public id?: string;
    public relations: HypermediaTreeRelation[];

    constructor(id?: string) {
        this.id = id;
    }
}
