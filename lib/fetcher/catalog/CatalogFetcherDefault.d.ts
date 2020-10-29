import LDFetch from "ldfetch";
import { Catalog } from "../../entities/catalog/catalog";
import { Dataset } from "../../entities/catalog/dataset";
import DatasetDistribution from "../../entities/catalog/dataset_distribution";
import { LDLoader } from "../../loader/ldloader";
import { ThingView } from "../../loader/views/single";
import ICatalogFetcher from "./ICatalogFetcher";
export default class CatalogFetcherDefault implements ICatalogFetcher {
    protected ldFetch: LDFetch;
    protected ldLoader: LDLoader;
    constructor(ldFetch: LDFetch);
    get(url: string): Promise<Catalog>;
    protected getView(): ThingView<Catalog>;
    protected getDatasetView(): ThingView<Dataset>;
    protected getDistributionView(): ThingView<DatasetDistribution>;
}
