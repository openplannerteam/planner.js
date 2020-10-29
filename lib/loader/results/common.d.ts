import { IEntityMap, ISemiEntity } from "../common";
export interface IThingViewResult<T extends ISemiEntity> {
    addEntity(entity: T): void;
    getContents(): T | IEntityMap<T>;
}
