import { IEntity } from "../../loader/common";
import ProfileConclusion from "./ProfileConclusion";
import ProfileCondition from "./ProfileCondition";

export default class ProfileRule implements IEntity {
    public static create(id: string): ProfileRule {
        return new ProfileRule(id);
    }

    public id: string;
    public conclusion: ProfileConclusion;
    public condition: ProfileCondition;
    public order: number;

    constructor(id: string) {
        this.id = id;
    }

    public getID(): string {
        return this.id;
    }
}
