import JourneyExtractionPhase from "./public-transport/JourneyExtractionPhase";
import ReachableStopsSearchPhase from "./stops/ReachableStopsSearchPhase";

type PlannerPhase = JourneyExtractionPhase | ReachableStopsSearchPhase;

export default PlannerPhase;
