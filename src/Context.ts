import { Container, injectable } from "inversify";


@injectable()
export default class Context {
  private value: string;
  private container: Container;

  setContainer(container: Container) {
    this.container = container;
  }

  getContainer() {
    this.container;
  }

  setTest(value) {
    this.value = value;
  }

  getTest() {
    return this.value;
  }
}
