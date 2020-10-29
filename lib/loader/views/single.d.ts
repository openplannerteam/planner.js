import { IEntity, ISemiEntity } from "../common";
import { IThingViewResult } from "../results/common";
export declare class ThingView<T extends ISemiEntity> {
    private entityType;
    private filters;
    private mappings;
    private nestedViews;
    private showId;
    private resultObject;
    constructor(entityType: (id?: string) => T);
    addEntity(entity: T): void;
    getContents(): T | import("../common").IEntityMap<T>;
    hideId(): void;
    addFilter(fn: (Entity: any) => boolean): void;
    addMapping(from: any, to: any, view?: ThingView<any>): void;
    process(entity: IEntity): T;
    createResultObject(): IThingViewResult<T>;
    private _filter;
    private _makeList;
    private _flattenLists;
    private _map;
}
