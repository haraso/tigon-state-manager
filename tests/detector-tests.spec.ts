import { Store } from '../index';

describe("detector tests", () => {

  test('default detector test', () => {
    const helloStore = Store("Hello", (state) => [state]);
    const callback = jest.fn();

    helloStore.subscribe(callback)

    const [, setHello] = helloStore();
    setHello("Hello World");

    expect(callback).toBeCalledTimes(1);

    setHello("Hello World");

    expect(callback).toBeCalledTimes(1);
  });

  test('detect test without default detector', () => {
    const helloStore = Store("Hello");
    const callback = jest.fn();

    helloStore.detect((state) => [state]).subscribe(callback)

    const [, setHello] = helloStore();
    setHello("Hello World");

    expect(callback).toBeCalledTimes(1);

    setHello("Hello World");

    expect(callback).toBeCalledTimes(1);
  });

  test('detect test with default detector and local detector', () => {
    const helloStore = Store("Hello", () => [Math.random()]);
    const callback = jest.fn();

    helloStore.detect((state) => [state]).subscribe(callback)

    const [, setHello] = helloStore();
    setHello("Hello World");

    expect(callback).toBeCalledTimes(1);

    setHello("Hello World");

    expect(callback).toBeCalledTimes(1);
  });

  test('detect test without default detector first time same value', () => {
    const helloStore = Store("Hello");
    const callback = jest.fn();

    helloStore.detect((state) => [state]).subscribe(callback)

    const [, setHello] = helloStore();
    setHello("Hello");

    expect(callback).toBeCalledTimes(0);
  });

  test('detect test with default detector and local detector first time same value', () => {
    const helloStore = Store("Hello", () => [Math.random()]);
    const callback = jest.fn();

    helloStore.detect((state) => [state]).subscribe(callback)

    const [, setHello] = helloStore();
    setHello("Hello");

    expect(callback).toBeCalledTimes(0);
  });

  test('detect test default detector first time same value', () => {
    const helloStore = Store("Hello", (state) => [state]);
    const callback = jest.fn();

    helloStore.subscribe(callback);

    const [, setHello] = helloStore();
    setHello("Hello");

    expect(callback).toBeCalledTimes(0);
  });

});