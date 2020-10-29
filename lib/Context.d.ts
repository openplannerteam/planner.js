import { Container } from "inversify";
/**
 * The Context serves as event pass through and holder of the inversify container object.
 *
 * It proxies an internal EventEmitter (instead of extending EventEmitter) because
 * ´decorate(injectable(), EventEmitter)´ causes errors when running tests in Jest
 */
export default class Context {
    private container;
    setContainer(container: Container): void;
    getContainer(): Container;
}
