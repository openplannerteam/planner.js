import EventType from "../enums/EventType";

export default class InvalidQueryError extends Error {
  public eventType = EventType.InvalidQuery;
}
