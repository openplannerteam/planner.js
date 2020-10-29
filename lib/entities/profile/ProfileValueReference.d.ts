import { IEntity } from "../../loader/common";
import { RoutableTileNode } from "../tiles/RoutableTileNode";
import { RoutableTileWay } from "../tiles/RoutableTileWay";
export default class ProfileValueReference implements IEntity {
    static create(id: string): ProfileValueReference;
    id: string;
    from: string;
    constructor(id: string);
    getID(): string;
    resolve(element: RoutableTileNode | RoutableTileWay): any;
}
