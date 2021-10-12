import { Store } from '../index';

describe("basic tests store", () => {
  const helloStore = Store("Hello");

  test('exist store', () => {
    expect(typeof helloStore).toEqual("function");
  });

  test('exist store.subscribe', () => {
    expect(typeof helloStore.subscribe).toEqual("function");
  });

  test('exist store.from', () => {
    expect(typeof helloStore.from).toEqual("function");
  });

  test('exist store.to', () => {
    expect(typeof helloStore.to).toEqual("function");
  });

  test('exist store.handler', () => {
    expect(helloStore.handler instanceof Array).toEqual(true);
    expect(helloStore.handler).toHaveLength(2);
  });

});
