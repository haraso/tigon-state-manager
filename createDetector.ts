export function createDetector<T extends any[], R>(cb: (...args: T) => R, deps: (...args: T) => any[], defaultArgs: T) {
  function detectorCb(...args: T) {
    const current = deps(...args);
    if (detectorCb.deps.length !== current.length) {
      detectorCb.deps = current;
      return cb(...args);
    }
    for (let i = 0; i < current.length; i++) {
      if (detectorCb.deps[i] === current[i]) continue;
      detectorCb.deps = current;
      return cb(...args);
    }
  }
  detectorCb.deps = deps(...defaultArgs);
  return detectorCb;
}
