import LDFetch from "../fetcher/LDFetch";
import { GEO, LC, PROFILE } from "../uri/constants";
import URI from "../uri/uri";
import DATATYPE from "./Datatypes";
import IDataSource from "./IDataSource";
import { Catalog } from "../entities/catalog/catalog";
import { Dataset } from "../entities/catalog/dataset";
import { DataType } from "..";

export default async function classifyDataSource(accessUrl: string): Promise<IDataSource> {
    let datatype: symbol;
    if (accessUrl.indexOf("tiles") >= 0) {
        if (accessUrl.indexOf("hdelva.be/") >= 0) {
            datatype = DATATYPE.ReducedRoutableTile;
        } else {
            datatype = DATATYPE.RoutableTile;
        }
    } else if (accessUrl.indexOf("hdelva.be/stops/distances/") >= 0) {
        datatype = DATATYPE.Footpath;
    } else {
        const fetcher = new LDFetch();
        const response = await fetcher.get(accessUrl);
        const triples = response.triples;

        const usedPredicates = new Set();

        for (const t of triples) {
            const { predicate } = t;
            usedPredicates.add(predicate.value);
        }


        //hier ergens zou ik kunnen checken op predicates die te maken hebben met transit tiles

        if (usedPredicates.has(URI.inNS(LC, "departureStop"))) {
            datatype = DATATYPE.Connections;
        } else if (usedPredicates.has(URI.inNS(GEO, "lat"))) {
            datatype = DATATYPE.Stops;
        } else if (usedPredicates.has(URI.inNS(PROFILE, "hasAccessRules"))) {
            datatype = DATATYPE.Profile;
        } else {
            datatype = DATATYPE.Unknown;
        }
    }

    return {
        accessUrl,
        datatype,
    };
}

export function classifyDataSet(dataSet: Dataset): IDataSource{
    let datatype: symbol;
    let accessUrl: string;
    let profile: string;

    if(dataSet.derivations){
        for(const derivation of dataSet.derivations){
            if(derivation.activity.algorithm === "https://hdelva.be/reduce_option/transit"){
                datatype = DataType.TransitTile;
            }
            if(derivation.activity.usedProfile){
                profile = derivation.activity.usedProfile;
            }
        }
    }
    else{
        datatype = DataType.RoutableTile
    }

    accessUrl = dataSet.distributions[0].accessUrl;

    return {
        accessUrl,
        datatype,
        profile,
    }
}
