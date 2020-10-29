import { IEntity } from "../../loader/common";
export default class ProfileCondition implements IEntity {
    static create(id: string): ProfileCondition;
    id: string;
    predicate: string;
    object: string;
    constructor(id: string);
    getID(): string;
}
