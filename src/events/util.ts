import { EventEmitter } from "events";
import defaultContainer from "../inversify.config";
import TYPES from "../types";

export default function getEventBus(): EventEmitter {
    return defaultContainer.get<EventEmitter>(TYPES.EventBus);
}
