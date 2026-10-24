import { useId, useMemo } from 'react';
import { mulberry32 } from '../../lib/rng';

const TIER_W = [200, 152, 104];
const TIER_H = [64, 54, 48];
const BASE_Y = 236;

function dripPath(x, y, w, seed) {
  const n = Math.max(3, Math.round(w / 20));
  const sw = w / n;
  const rng = mulberry32(seed);
  let d = `M${x} ${y} H${x + w} V${y + 7} `;
  for (let i = n - 1; i >= 0; i--) {
    const xr = x + (i + 1) * sw;
    const xl = x + i * sw;
    const depth = (6 + Math.round(rng() * 16)) * 1.35;
    d += `C${xr} ${y + 7 + depth} ${xl} ${y + 7 + depth} ${xl} ${y + 7} `;
  }
  return `${d}Z`;
}

const DEFAULT_COLORS = {
  cake: '#f7b6d2',
  frosting: '#ffffff',
  trim: '#ff4d8d',
  plate: '#e9e3f5',
  candles: ['#ff4d8d', '#3ddcb4', '#ffc83d', '#8b7cff', '#4dc9ff'],
  sprinkles: ['#ff4d8d', '#ffc83d', '#3ddcb4', '#8b7cff', '#ffffff'],
};

/**
 * Layered SVG cake with animated candle flames. Width-driven: give it w-full or a width.
 *   tiers 1-3, candles 1-9, lit true/false (false = a little smoke puff once).
 *   colors: partial override of { cake, frosting, trim, plate, candles[], sprinkles[] }
 *   onClick: e.g. blow the candles out.
 */
export default function Cake({ tiers = 2, candles = 5, lit = true, colors, className = '', style, onClick, seed = 7 }) {
  const id = useId().replace(/:/g, '');
  const c = { ...DEFAULT_COLORS, ...colors };
  const t = Math.min(3, Math.max(1, tiers));

  const layout = useMemo(() => {
    const list = [];
    let y = BASE_Y;
    for (let i = 0; i < t; i++) {
      const w = TIER_W[i];
      const h = TIER_H[i];
      y -= h;
      list.push({ w, h, x: 120 - w / 2, y, i });
    }
    const top = list[list.length - 1];
    const rng = mulberry32(seed);
    const sprinkles = [];
    list.forEach((tier) => {
      const n = Math.round(tier.w / 9);
      for (let k = 0; k < n; k++) {
        sprinkles.push({
          x: tier.x + 8 + rng() * (tier.w - 16),
          y: tier.y + 24 + rng() * (tier.h - 38),
          r: Math.round(rng() * 160) - 80,
          color: c.sprinkles[Math.floor(rng() * c.sprinkles.length)],
        });
      }
    });
    const n = Math.min(9, Math.max(1, candles));
    const span = Math.min(top.w * 0.68, (n - 1) * 20);
    const cs = Array.from({ length: n }, (_, k) => ({
      x: n === 1 ? 120 : 120 - span / 2 + (span * k) / (n - 1),
      color: c.candles[k % c.candles.length],
      delay: (k * 0.17).toFixed(2),
    }));
    return { list, top, sprinkles, cs };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, candles, seed, c.sprinkles.join(), c.candles.join()]);

  const topY = layout.top.y;
  const vbTop = Math.floor(topY - 34 - 40);
  const vbH = 262 - vbTop;

  return (
    <svg
      viewBox={`0 ${vbTop} 240 ${vbH}`}
      className={className}
      style={{ overflow: 'visible', cursor: onClick ? 'pointer' : undefined, ...style }}
      onClick={onClick}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-cake`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: `color-mix(in srgb, ${c.cake} 85%, white)` }} />
          <stop offset="100%" style={{ stopColor: `color-mix(in srgb, ${c.cake} 82%, black)` }} />
        </linearGradient>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0%" stopColor="#ffd36b" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ff9d2e" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="35%" stopColor="#fff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.12" />
        </linearGradient>
      </defs>

      {/* plate */}
      <ellipse cx="120" cy={BASE_Y + 7} rx="118" ry="11" fill={c.plate} />
      <ellipse cx="120" cy={BASE_Y + 4} rx="112" ry="8" fill="#fff" opacity="0.55" />

      {/* tiers, bottom first */}
      {layout.list.map((tier) => (
        <g key={tier.i}>
          <rect x={tier.x} y={tier.y} width={tier.w} height={tier.h} rx="9" fill={`url(#${id}-cake)`} />
          <rect x={tier.x} y={tier.y + tier.h - 20} width={tier.w} height="9" fill={c.trim} opacity="0.9" />
          {layout.sprinkles
            .filter((s) => s.x >= tier.x && s.x <= tier.x + tier.w && s.y >= tier.y && s.y <= tier.y + tier.h)
            .map((s, k) => (
              <rect key={k} x={s.x - 3} y={s.y - 0.9} width="6" height="1.8" rx="0.9" fill={s.color} transform={`rotate(${s.r} ${s.x} ${s.y})`} />
            ))}
          <path d={dripPath(tier.x, tier.y - 2, tier.w, seed + tier.i)} fill={c.frosting} />
          <rect x={tier.x} y={tier.y} width={tier.w} height={tier.h} rx="9" fill={`url(#${id}-sheen)`} />
        </g>
      ))}

      {/* candles */}
      {layout.cs.map((cd, k) => (
        <g key={k} transform={`translate(${cd.x} ${topY - 2})`}>
          <rect x="-4" y="-34" width="8" height="36" rx="2.4" fill={cd.color} />
          <rect x="-4" y="-27" width="8" height="3.2" fill="#fff" opacity="0.55" />
          <rect x="-4" y="-17" width="8" height="3.2" fill="#fff" opacity="0.55" />
          <rect x="-4" y="-7" width="8" height="3.2" fill="#fff" opacity="0.55" />
          <rect x="-0.8" y="-38" width="1.6" height="5" fill="#3a2a2a" />
          <g transform="translate(0 -37)">
            {lit ? (
              <>
                <circle cy="-13" r="24" fill={`url(#${id}-glow)`} className="animate-pulse" style={{ animationDelay: `${cd.delay}s` }} />
                <g className="animate-flicker" style={{ transformBox: 'fill-box', transformOrigin: '50% 100%', animationDelay: `${cd.delay}s` }}>
                  <path d="M0 0 C 6.5 -6 6.5 -15 0 -26 C -6.5 -15 -6.5 -6 0 0 Z" fill="#ffae2b" />
                  <path d="M0 -1 C 3.4 -4 3.4 -9 0 -15 C -3.4 -9 -3.4 -4 0 -1 Z" fill="#fff4b8" />
                </g>
              </>
            ) : (
              [0, 1, 2].map((s) => (
                <circle
                  key={s}
                  r="3.4"
                  cy="-6"
                  fill="#fff"
                  className="animate-smoke"
                  style={{ transformBox: 'fill-box', transformOrigin: 'center', animationDelay: `${s * 0.35 + Number(cd.delay)}s`, opacity: 0 }}
                />
              ))
            )}
          </g>
        </g>
      ))}
    </svg>
  );
}
