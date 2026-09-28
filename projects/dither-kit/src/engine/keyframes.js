// Per-parameter keyframes. A stage's `keyframes` maps option name → [{ t, v }] sorted by t.

const ease = (x) => x * x * (3 - 2 * x);

export const evaluate = (keys, t) => {
  if (t <= keys[0].t) return keys[0].v;
  const last = keys[keys.length - 1];
  if (t >= last.t) return last.v;
  const i = keys.findIndex((k) => k.t > t);
  const a = keys[i - 1];
  const b = keys[i];
  return a.v + (b.v - a.v) * ease((t - a.t) / (b.t - a.t));
};

export const resolveOptions = (stage, t) => {
  const out = { ...stage.options };
  for (const [param, keys] of Object.entries(stage.keyframes ?? {})) {
    if (keys.length) out[param] = evaluate(keys, t);
  }
  return out;
};

// Frames closer than half a frame count as the same keyframe.
const EPS = 1 / 120;

export const setKey = (keys = [], t, v) =>
  [...keys.filter((k) => Math.abs(k.t - t) > EPS), { t, v }].sort((a, b) => a.t - b.t);

export const removeKey = (keys = [], t) => keys.filter((k) => Math.abs(k.t - t) > EPS);

export const hasKeyAt = (keys = [], t) => keys.some((k) => Math.abs(k.t - t) <= EPS);
