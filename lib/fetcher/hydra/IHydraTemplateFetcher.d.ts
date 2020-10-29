import { HydraTemplate } from "../../entities/hydra/search";
export default interface IHydraTemplateFetcher {
    get(url: string): Promise<HydraTemplate>;
}
