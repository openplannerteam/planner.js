import { EventEmitter } from "events";
import { Container, decorate, injectable } from "inversify";

decorate(injectable(), EventEmitter);

@injectable()
export default class Context extends EventEmitter {
  private container: Container;

  public setContainer(container: Container) {
    this.container = container;
  }

  public getContainer() {
    return this.container;
  }
}
