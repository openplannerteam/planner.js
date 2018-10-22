import IConnectionsFetcher from "./IConnectionsFetcher";
import { AsyncIterator } from "asynciterator";
import IConnection from "./IConnection";
import { injectable } from "inversify";


@injectable()
export default class ConnectionsFetcherComunica implements IConnectionsFetcher {
  fetch: () => AsyncIterator<IConnection>;

}
