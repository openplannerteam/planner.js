import { AsyncIterator } from "asynciterator";
import { injectable } from "inversify";
import IConnection from "./IConnection";
import IConnectionsFetcher from "./IConnectionsFetcher";

@injectable()
export default class ConnectionsFetcherLDFetch implements IConnectionsFetcher {
  public fetch: () => AsyncIterator<IConnection>;

}
