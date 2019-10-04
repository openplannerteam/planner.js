import { IEntity, ISemiEntity } from "../common";
import { IndexThingViewResult } from "../results";
import { IThingViewResult } from "../results/common";
import { ThingView } from "./single";

export class IndexThingView<T extends IEntity> extends ThingView<T> {
    public createResultObject(): IThingViewResult<T> {
        return new IndexThingViewResult();
    }
}
