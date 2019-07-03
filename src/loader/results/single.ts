import { ISemiEntity } from "../common";
import { IThingViewResult } from "./common";

export class SingleThingViewResult<T extends ISemiEntity> implements IThingViewResult<T> {
    private contents: T;
    public addEntity(entity: T): void {
        this.contents = entity;
    }

    public getContents(): T {
        return this.contents;
    }
}
