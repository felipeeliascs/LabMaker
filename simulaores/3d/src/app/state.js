/** Tiny pub/sub app state — no framework. */
const listeners = new Map();

export const state = {
  fileName: null,
  analysis: null,       // result from worker 'analysis'
  positions: null,      // Float32Array copy for preview mesh
  toolpath: null,       // result from worker 'sliced'
  layerCount: 0,
  layerHeight: 0.2,
  infill: 0.2,
  sliced: false,
  staleSlice: false,    // layer height changed after slicing
};

export function on(event, fn) {
  if (!listeners.has(event)) listeners.set(event, []);
  listeners.get(event).push(fn);
}

export function emit(event, payload) {
  const fns = listeners.get(event);
  if (fns) for (const fn of fns) fn(payload);
}
