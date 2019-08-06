import EventType from "../events/EventType";

export default class InvalidQueryError extends Error {
  public eventType = EventType.InvalidQuery;
}
