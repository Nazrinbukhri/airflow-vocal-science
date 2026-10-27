// Small shared helpers: easing, keyframe evaluation, seeded randomness.

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// Deterministic pseudo-random generator (mulberry32) so the anatomy
// looks the same on every load.
export function makeRng(seed = 1) {
  let a = seed >>> 0;
  return function rng() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Evaluate a list of keyframes [{t, a: 1, b: 2}, ...] at local time lt.
// Values ease smoothly between keys. Keys missing a property inherit it
// from the previous key (or from defaults).
export function evalKeys(keys, lt, defaults) {
  const out = { ...defaults };
  if (!keys || !keys.length) return out;
  // Fill forward so every key has every property.
  const filled = [];
  let prev = { ...defaults };
  for (const k of keys) {
    const f = { ...prev, ...k };
    filled.push(f);
    prev = f;
  }
  if (lt <= filled[0].t) return { ...filled[0] };
  for (let i = 0; i < filled.length - 1; i++) {
    const a = filled[i];
    const b = filled[i + 1];
    if (lt >= a.t && lt <= b.t) {
      const span = Math.max(1e-6, b.t - a.t);
      const e = easeInOutCubic(clamp((lt - a.t) / span));
      for (const key in b) {
        if (key === 't') continue;
        const va = a[key];
        const vb = b[key];
        out[key] = typeof va === 'number' && typeof vb === 'number' ? lerp(va, vb, e) : (e < 0.5 ? va : vb);
      }
      out.t = lt;
      return out;
    }
  }
  return { ...filled[filled.length - 1] };
}

export function formatTime(s) {
  s = Math.max(0, s);
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, '0')}`;
}
