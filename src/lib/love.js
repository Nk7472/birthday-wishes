// Helpers shared by the Lovers scenes.

/** "3 years together" / "1 year together" / '' when no number was given. */
export const togetherText = (w) => (w.age ? `${w.age} ${w.age === 1 ? 'year' : 'years'} together` : '');

/** Points of a heart outline, normalised to 0..1 (x right, y down). */
export function heartPoints(n = 18) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    pts.push({ x: 0.5 + x / 36, y: 0.5 + (y + 1.5) / 34 });
  }
  return pts;
}

/** Text size (cqw) for a message so it always fits its card. */
export const msgSize = (text, big = 4.6, small = 3.3) => {
  const n = text.length;
  return n > 220 ? small : n > 150 ? small + (big - small) * 0.35 : n > 90 ? small + (big - small) * 0.7 : big;
};
