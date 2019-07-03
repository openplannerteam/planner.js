import { RDF } from "../../uri/constants";
import URI from "../../uri/uri";
import { IEntity, ISemiEntity } from "../common";
import { IThingViewResult } from "../results/common";
import { SingleThingViewResult } from "../results/single";

export class ThingView<T extends ISemiEntity> {
    private filters: Array<(entity: IEntity) => boolean> = [];
    private mappings = {};
    private nestedViews = {};
    private showId = true;
    private resultObject: IThingViewResult<T>;

    constructor(private entityType: (id?: string) => T) {
        this.resultObject = this.createResultObject();
    }

    public addEntity(entity: T) {
        this.resultObject.addEntity(entity);
    }

    public getContents() {
        return this.resultObject.getContents();
    }

    public hideId() {
        this.showId = false;
    }

    public addFilter(fn: (Entity) => boolean) {
        this.filters.push(fn);
    }

    public addMapping(from, to, view?: ThingView<any>) {
        this.mappings[from] = to;
        this.nestedViews[from] = view;
    }

    public process(entity: IEntity): T {
        if (this._filter(entity)) {
            return this._map(entity);
        }
    }

    public createResultObject(): IThingViewResult<T> {
        return new SingleThingViewResult();
    }

    private _filter(entity: IEntity) {
        let ok = true;
        for (const fn of this.filters) {
            if (!fn(entity)) {
                ok = false;
                break;
            }
        }
        return ok;
    }

    private _makeList(element: IEntity): any[] {
        let current = element;
        const list = [current[URI.inNS(RDF, "first")]];
        let rest = current[URI.inNS(RDF, "rest")];

        while (rest && rest !== URI.inNS(RDF, "nil")) {
            current = rest;
            list.push(current[URI.inNS(RDF, "first")]);
            rest = current[URI.inNS(RDF, "rest")];
        }

        return list;
    }

    private _flattenLists(entity: IEntity) {
        for (const kv of Object.entries(entity)) {
            const [field, entityValue] = kv;
            if (Array.isArray(entityValue)) {
                for (const v of entityValue.entries()) {
                    const [valueElementIndex, valueElement] = v;
                    if (valueElement[URI.inNS(RDF, "first")]) {
                        const list = this._makeList(valueElement);
                        entityValue[valueElementIndex] = list;
                    }
                }
            }
            if (entityValue[URI.inNS(RDF, "first")]) {
                // this value should become an array
                entity[field] = this._makeList(entityValue);
            }
        }
    }

    private _map(entity: IEntity): T {
        this._flattenLists(entity);

        let result;
        if (this.showId) {
            result = this.entityType(entity.id);
        } else {
            result = this.entityType();
        }

        for (const kv of Object.entries(entity)) {
            const field = kv[0];
            let value = kv[1];
            const fieldView = this.nestedViews[field];
            if (fieldView) {
                if (Array.isArray(value)) {
                    value = value.map((v) => fieldView.process(v));
                } else {
                    value = fieldView.process(value);
                }
            }
            const destinationField = this.mappings[field];
            if (destinationField) {
                result[destinationField] = value;
            }
        }
        return result;
    }
}
