import { Catalog } from "../../entities/catalog/catalog";

export default interface ICatalogProvider {
  getCatalog(catalogId: string): Promise<Catalog>;
  getCatalogs(): Promise<Catalog[]>;
}
