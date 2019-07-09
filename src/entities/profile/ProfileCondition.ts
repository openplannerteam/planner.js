import { IEntity } from "../../loader/common";

export default class ProfileCondition implements IEntity {
    public static create(id: string): ProfileCondition {
        return new ProfileCondition(id);
    }

    public id: string;
    public predicate: string;
    public object: string;

    constructor(id: string) {
        this.id = id;
    }

    public getID(): string {
        return this.id;
    }
}
