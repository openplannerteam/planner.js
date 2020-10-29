import { Catalog } from "../../entities/catalog/catalog";
export default interface ICatalogFetcher {
    get(url: string): Promise<Catalog>;
}
