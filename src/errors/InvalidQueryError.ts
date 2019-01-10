import EventType from "../EventType";

export default class InvalidQueryError extends Error {
  public eventType = EventType.InvalidQuery;
}
