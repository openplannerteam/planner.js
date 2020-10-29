import { ISemiEntity } from "../common";
import { IThingViewResult } from "./common";
export declare class SingleThingViewResult<T extends ISemiEntity> implements IThingViewResult<T> {
    private contents;
    addEntity(entity: T): void;
    getContents(): T;
}
