import { Container, injectable } from "inversify";

/**
 * The Context serves as event pass through and holder of the inversify container object.
 *
 * It proxies an internal EventEmitter (instead of extending EventEmitter) because
 * ´decorate(injectable(), EventEmitter)´ causes errors when running tests in Jest
 */
@injectable()
export default class Context {
  private container: Container;

  public setContainer(container: Container) {
    this.container = container;
  }

  public getContainer() {
    return this.container;
  }
}
