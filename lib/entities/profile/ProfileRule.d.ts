import { IEntity } from "../../loader/common";
import ProfileConclusion from "./ProfileConclusion";
import ProfileCondition from "./ProfileCondition";
export default class ProfileRule implements IEntity {
    static create(id: string): ProfileRule;
    id: string;
    conclusion: ProfileConclusion;
    condition: ProfileCondition;
    order: number;
    constructor(id: string);
    getID(): string;
}
