import { IEntity } from "../../loader/common";
import ProfileValueReference from "./ProfileValueReference";
export default class ProfileConclusion implements IEntity {
    static create(id: string): ProfileConclusion;
    id: string;
    hasAccess?: boolean;
    isOneway?: boolean;
    isReversed?: boolean;
    speed?: number | ProfileValueReference;
    isObstacle?: boolean;
    priority?: number;
    obstacleTime?: number;
    constructor(id: string);
    getID(): string;
}
