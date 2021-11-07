import { Setter } from "./Store";

export function createSetter<S>(getState: () => S, setters: ((value: S) => void)[], setting: { skipMapFrom: boolean; }): Setter<S> {
  function set(value: S | ((value: S) => S)) {
    const currentState = getState();
    if (typeof value === 'function') {
      value = (value as Function)(currentState);
    }
    setting.skipMapFrom = true;
    setters.forEach((setter) => setter(value as S));
    setting.skipMapFrom = false;
  }
  set.async = async function async(cb: (value: S) => Promise<S>) {
    const currentState = getState();
    const value = await cb(currentState);
    setting.skipMapFrom = true;
    setters.forEach((setter) => setter(value));
    setting.skipMapFrom = false;
  };
  return set;
}
