// Tiny seeded PRNG so "random" layouts are stable between renders and SSR.
export function mulberry32(seed = 1) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const between = (rng, min, max) => min + (max - min) * rng();
export const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

/** Build a stable list of n items. fn receives (rng, i). */
export function makeList(n, seed, fn) {
  const rng = mulberry32(seed);
  return Array.from({ length: n }, (_, i) => fn(rng, i));
}
