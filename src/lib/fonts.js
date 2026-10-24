// Template display fonts are fetched only when a template needs them, so the
// first paint only waits on one UI font instead of eleven families.
const SPECS = {
  Pacifico: 'Pacifico',
  'Dancing Script': 'Dancing+Script:wght@600;700',
  Fredoka: 'Fredoka:wght@400;500;700',
  Bangers: 'Bangers',
  Righteous: 'Righteous',
  Caveat: 'Caveat:wght@500;700',
  Cinzel: 'Cinzel:wght@500;700;900',
  'Playfair Display': 'Playfair+Display:ital,wght@0,500;0,800;1,500',
  Monoton: 'Monoton',
  'Press Start 2P': 'Press+Start+2P',
};
const loaded = new Set();
/** Google Fonts stylesheet URLs requested so far (the video export reads these to embed the fonts). */
export const fontSheets = [];

export function loadFonts(names = []) {
  if (typeof document === 'undefined') return;
  const fresh = names.filter((n) => SPECS[n] && !loaded.has(n));
  if (!fresh.length) return;
  fresh.forEach((n) => loaded.add(n));
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?${fresh.map((n) => `family=${SPECS[n]}`).join('&')}&display=swap`;
  fontSheets.push(link.href);
  document.head.appendChild(link);
}
