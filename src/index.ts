import "isomorphic-fetch";
import "reflect-metadata";

import IsochroneGenerator from "./analytics/isochrones/main";
import EventBus from "./events/EventBus";
import EventType from "./events/EventType";
import BasicTrainPlanner from "./planner/configurations/BasicTrainPlanner";
import DissectPlanner from "./planner/configurations/DissectPlanner";
import TransitCarPlanner from "./planner/configurations/TransitCarPlanner";
import Units from "./util/Units";

export { default as EventType } from "./events/EventType";
export { default as IsochroneGenerator } from "./analytics/isochrones/main";
export { default as Units } from "./util/Units";
export { default as BasicTrainPlanner } from "./planner/configurations/BasicTrainPlanner";
export { default as DissectPlanner } from "./planner/configurations/DissectPlanner";
export { default as TransitCarPlanner } from "./planner/configurations/TransitCarPlanner";

export const eventBus = EventBus.getInstance();

export default {
    EventType,
    IsochroneGenerator,
    Units,
    EventBus: eventBus,
    BasicTrainPlanner,
    DissectPlanner,
    TransitCarPlanner,
};
