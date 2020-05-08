import ICatalogFetcher from "./ICatalogFetcher";
import { injectable } from "inversify";
import { Catalog } from "../../entities/catalog/catalog";
import EventBus from "../../events/EventBus";
import EventType from "../../events/EventType";
import { Dataset } from "../../entities/catalog/dataset";
import DatasetDistribution from "../../entities/catalog/dataset_distribution";
import { Derivation } from "../../entities/catalog/derivation";
import { Activity } from "../../entities/catalog/activity";
import { tesselate } from "@turf/turf";

@injectable()
export default class CatalogFetcherRaw implements ICatalogFetcher {

    public async get(url: string): Promise<Catalog> {
        const response = await fetch(url);
        const responseText = await response.text();
        let catalog: Catalog;

        if (response.status !== 200) {
            EventBus.getInstance().emit(EventType.Warning, `${url} responded with status code ${response.status}`);
        }
        if (response.status === 200 && responseText) {
            const blob = JSON.parse(responseText);

            catalog = Catalog.create(blob["@id"]);

            let datasets: Dataset[] = [];
            //hier start je met het overlopen van de datasets
            for (const entity of blob["dataset"]) {
                let dataset = Dataset.create(entity["@id"]);

                let datasetDistributions: DatasetDistribution[] = [];

                //hier start je met het overlopen van de distributions
                for (const dist of entity["dcat:distribution"]) {
                    let distribution = DatasetDistribution.create(dist["@id"]);
                    distribution.accessUrl = dist["accessURL"];
                    datasetDistributions.push(distribution);
                }
                dataset.distributions = datasetDistributions;

                let derivations: Derivation[] = [];

                if (entity["prov:qualifiedDerivation"]) {

                    let derivationJSON = entity["prov:qualifiedDerivation"];
                    let derivationObject = Derivation.create("");

                    let activityJSON = derivationJSON["prov:hadActivity"];
                    let activityObject = Activity.create("");
                    activityObject.algorithm = activityJSON["ex:algorithm"];

                    derivationObject.entity = derivationJSON["prov:entity"];
                    derivationObject.activity = activityObject;

                    let onDataJSON = activityJSON["ex:onData"];

                    while (onDataJSON["prov:qualifiedDerivation"]) {
                        derivations.push(derivationObject);

                        derivationJSON = onDataJSON["prov:qualifiedDerivation"];
                        derivationObject = Derivation.create("");
                        activityJSON = derivationJSON["prov:hadActivity"];
                        activityObject = Activity.create("");
                        activityObject.algorithm = activityJSON["ex:algorithm"];
                        activityObject.usedProfile = activityJSON["ex:usingProfile"];

                        derivationObject.entity = derivationJSON["prov:entity"];
                        derivationObject.activity = activityObject;

                        onDataJSON = activityJSON["ex:onData"];
                    }
                    derivations.push(derivationObject);

                    dataset.baseDataUrl = onDataJSON;
                    dataset.derivations = derivations;
                }

                datasets.push(dataset);
            }

            catalog.datasets = datasets;
        }
        return catalog;
    }

}