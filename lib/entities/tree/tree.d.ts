import HypermediaTreeRelation from "./relation";
export default class HypermediaTree {
    static create(id?: string): HypermediaTree;
    id?: string;
    relations: HypermediaTreeRelation[];
    constructor(id?: string);
}
