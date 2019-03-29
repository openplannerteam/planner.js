import { IEntity, IEntityMap } from "../common";
import { IThingViewResult } from "./common";

export class IndexThingViewResult<T extends IEntity> implements IThingViewResult<T> {
    private contents: IEntityMap<T>;

    constructor() {
        this.contents = {};
    }

    public addEntity(entity: T) {
        this.contents[entity.id] = entity;
    }

    public getContents(): IEntityMap<T> {
        return this.contents;
    }
}
