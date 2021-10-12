import { Store } from '../index';

function getAsyncValue<T>(value: T, timeout: number): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), timeout);
  });
}

describe("functional tests", () => {

  test('change value', () => {
    const helloStore = Store("Hello");
    const [hello, setHello] = helloStore();

    setHello("Hello World");
    expect(hello).toEqual("Hello");

    const [changedHello] = helloStore();
    expect(changedHello).toEqual("Hello World");
  });

  test('change value with function', () => {
    const helloStore = Store("Hello");
    const [hello, setHello] = helloStore();

    setHello((state) => {
      expect(state).toEqual(hello);
      return "Hello World";
    });

    const [changedHello] = helloStore();
    expect(changedHello).toEqual("Hello World");
  });

  test('subscribe test', () => {
    const helloStore = Store("Hello");
    const callback = jest.fn();

    helloStore.subscribe(callback)

    const [, setHello] = helloStore();
    setHello("Hello World");

    expect(callback).toBeCalledTimes(1);
  });

  test('unsubscribe test', () => {
    const helloStore = Store("Hello");
    const callback = jest.fn();

    const unsubscribe = helloStore.subscribe(callback);
    unsubscribe();

    const [, setHello] = helloStore();
    setHello("Hello World");

    expect(callback).toBeCalledTimes(0);
  });

  test('subscription callback args test', () => {
    const helloStore = Store("Hello");
    const callback = jest.fn();

    helloStore.subscribe(callback)

    const [, setHello] = helloStore();
    setHello("Hello World");

    const args = callback.mock.calls[0];
    expect(args).toHaveLength(2);

    const [value, setter] = args;
    expect(value).toEqual("Hello World");
    expect(setter).toEqual(setHello);
  });

  test('change value with async function', async () => {
    const helloStore = Store("Hello");
    const [hello, setHello] = helloStore();

    await setHello.async(async (state) => {
      expect(state).toEqual(hello);
      return await getAsyncValue("Hello World", 100);
    });

    const [changedHello] = helloStore();
    expect(changedHello).toEqual("Hello World");
  });


  test('subscription callback args test with async change', async () => {
    const helloStore = Store("Hello");
    const callback = jest.fn();

    helloStore.subscribe(callback);
    const [hello, setHello] = helloStore();

    await setHello.async(async (state) => {
      expect(state).toEqual(hello);
      return await getAsyncValue("Hello World", 100);
    });

    expect(callback).toBeCalledTimes(1);

    const args = callback.mock.calls[0];
    expect(args).toHaveLength(2);

    const [value, setter] = args;
    expect(value).toEqual("Hello World");
    expect(setter).toEqual(setHello);
  });

});