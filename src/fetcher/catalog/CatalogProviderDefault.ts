import { inject, injectable } from "inversify";
import { Catalog } from "../../entities/catalog/catalog";
import TYPES from "../../types";
import ICatalogFetcher from "./ICatalogFetcher";
import ICatalogProvider from "./ICatalogProvider";

interface ICatalogMap {
    [label: string]: Promise<Catalog>;
}

@injectable()
export default class CatalogProviderDefault implements ICatalogProvider {

    private catalogs: ICatalogMap;
    private fetcher: ICatalogFetcher;

    constructor(
        @inject(TYPES.CatalogFetcher) fetcher: ICatalogFetcher,
    ) {
        this.catalogs = {};
        this.fetcher = fetcher;
    }

    public getCatalog(catalogId: string): Promise<Catalog> {
        if (this.catalogs[catalogId] === undefined) {
            this.catalogs[catalogId] = this.fetcher.get(catalogId);
        }
        return this.catalogs[catalogId];
    }

    public getCatalogs(): Promise<Catalog[]> {
        return Promise.all(Object.values(this.catalogs));
    }
}
