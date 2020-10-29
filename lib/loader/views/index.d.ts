import { IEntity } from "../common";
import { IThingViewResult } from "../results/common";
import { ThingView } from "./single";
export declare class IndexThingView<T extends IEntity> extends ThingView<T> {
    createResultObject(): IThingViewResult<T>;
}
