import EventType from "../events/EventType";
export default class InvalidQueryError extends Error {
    eventType: EventType;
}
