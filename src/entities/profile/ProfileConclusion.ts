import { IEntity } from "../../loader/common";
import ProfileValueReference from "./ProfileValueReference";

export default class ProfileConclusion implements IEntity {
    public static create(id: string): ProfileConclusion {
        return new ProfileConclusion(id);
    }

    public id: string;
    public hasAccess?: boolean;
    public isOneway?: boolean;
    public isReversed?: boolean;
    public speed?: number | ProfileValueReference;
    public isObstacle?: boolean;
    public priority?: number;
    public obstacleTime?: number;

    constructor(id: string) {
        this.id = id;
    }

    public getID(): string {
        return this.id;
    }
}
