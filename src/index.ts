import "isomorphic-fetch";
import "reflect-metadata";
import basicTrainProfile from "./configs/basic_train";

import IsochroneGenerator from "./analytics/isochrones/main";
import EventBus from "./events/EventBus";
import EventType from "./events/EventType";
import Planner from "./Planner";
import Units from "./util/Units";

export { default as EventType } from "./events/EventType";
export { default as IsochroneGenerator } from "./analytics/isochrones/main";
export { default as Units } from "./util/Units";

export class BasicTrainPlanner extends Planner {
    constructor() {
        super(basicTrainProfile);
    }
}

export const eventBus = EventBus.getInstance();

export default {
    EventType,
    IsochroneGenerator,
    BasicTrainPlanner,
    Units,
    EventBus: eventBus,
};
