import HypermediaTree from "../../entities/tree/tree";
export default interface IHypermediaTreeFetcher {
    get(url: string): Promise<HypermediaTree>;
}
