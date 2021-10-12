import { Store } from '../index';

describe("basic tests store handler", () => {
  const helloStore = Store("Hello");
  const [hello, setHello] = helloStore();

  test('value is same', () => {
    expect(hello).toEqual("Hello");
  });

  test('exist setter', () => {
    expect(typeof setHello).toEqual("function");
  });

  test('exist setter.async', () => {
    expect(typeof setHello.async).toEqual("function");
  });

});