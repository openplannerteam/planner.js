import LDFetch from "../fetcher/LDFetch";
import { GEO, LC, PROFILE } from "../uri/constants";
import URI from "../uri/uri";
import DATATYPE from "./Datatypes";
import IDataSource from "./IDataSource";

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
