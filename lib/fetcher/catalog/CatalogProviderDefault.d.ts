import { Catalog } from "../../entities/catalog/catalog";
import ICatalogFetcher from "./ICatalogFetcher";
import ICatalogProvider from "./ICatalogProvider";
export default class CatalogProviderDefault implements ICatalogProvider {
    private catalogs;
    private fetcher;
    constructor(fetcher: ICatalogFetcher);
    getCatalog(catalogId: string): Promise<Catalog>;
    getCatalogs(): Promise<Catalog[]>;
}
