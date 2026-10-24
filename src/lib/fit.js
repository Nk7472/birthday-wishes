// Font-size helper so long names never overflow. Returns a CSS length in cqmin.
//   style={{ fontSize: fitName(w.name, 13) }}
// max: size (cqmin) used for short names. factor: average glyph width in em
// (script ~0.5, caps display ~0.75). width: usable line width in cqmin.
export function fitName(name, max = 13, { factor = 0.5, width = 72, min = 4 } = {}) {
  const len = Math.max(1, [...String(name)].length);
  const size = Math.max(min, Math.min(max, width / (len * factor)));
  return `${size.toFixed(2)}cqmin`;
}
