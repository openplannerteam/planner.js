import { IEntity } from "../../loader/common";
import { RoutableTileNode } from "../tiles/node";
import { RoutableTileWay } from "../tiles/way";

export default class ProfileValueReference implements IEntity {
    public static create(id: string): ProfileValueReference {
        return new ProfileValueReference(id);
    }

    public id: string;
    public from: string;

    constructor(id: string) {
        this.id = id;
    }

    public getID(): string {
        return this.id;
    }

    public resolve(element: RoutableTileNode | RoutableTileWay) {
        return element[this.from];
    }
}
