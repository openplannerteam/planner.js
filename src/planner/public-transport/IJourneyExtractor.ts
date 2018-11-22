import IPath from "../../interfaces/IPath";
import IResolvedQuery from "../../query-runner/IResolvedQuery";
import IProfilesByStop from "./CSA/data-structure/stops/IProfilesByStop";

export default interface IJourneyExtractor {
  extractJourneys: (profiles: IProfilesByStop, query: IResolvedQuery) => Promise<IPath[]>;
}
