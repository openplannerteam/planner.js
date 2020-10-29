import { IEntity, IEntityMap } from "../common";
import { IThingViewResult } from "./common";
export declare class IndexThingViewResult<T extends IEntity> implements IThingViewResult<T> {
    private contents;
    constructor();
    addEntity(entity: T): void;
    getContents(): IEntityMap<T>;
}
