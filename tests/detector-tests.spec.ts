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

  test('detect test default detector', () => {
    const helloStore = Store("Hello", () => [Math.random()]);
    const callback = jest.fn();

    helloStore.detect((state) => [state]).subscribe(callback)

    const [, setHello] = helloStore();
    setHello("Hello World");

    expect(callback).toBeCalledTimes(1);

    setHello("Hello World");

    expect(callback).toBeCalledTimes(1);
  });

});