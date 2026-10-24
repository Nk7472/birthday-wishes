import { useQuality } from '../../lib/quality';
import { useMemo } from 'react';
import { between, makeList } from '../../lib/rng';

// Full class names so Tailwind can generate them.
const ANIMS = {
  rise: 'animate-rise-up',
  fall: 'animate-fall',
  twinkle: 'animate-twinkle',
  float: 'animate-float',
  'float-slow': 'animate-float-slow',
  spin: 'animate-spin-slow',
  sway: 'animate-sway',
  none: '',
};

/**
 * A field of drifting things — balloons, petals, stars, bubbles, snow…
 *
 *   <Drift count={14} anim="rise" size={[40, 90]} duration={[10, 18]}>
 *     {(p) => <Balloon color={p.color} className="w-full" />}
 *   </Drift>
 *
 * anim: rise (bottom→top) | fall (top→bottom) | twinkle | float | float-slow | spin | sway
 * For rise/fall the element starts at the top-left and is translated, so give
 * it a size via p.size (px). Children render-prop receives:
 *   { i, size, color, hue, rot, x, y }      (all stable between renders)
 * prefill (default true): items start mid-flight, so the screen is never empty.
 * sway: adds a gentle side-to-side wobble to rising/falling items.
 */
export default function Drift({
  count: rawCount = 20,
  seed = 1,
  anim = 'rise',
  size = [12, 32],
  duration = [10, 20],
  delay = [0, 10],
  x = [0, 100],
  y = [0, 100],
  colors = ['#ff4d8d', '#ffc83d', '#3ddcb4', '#8b7cff', '#4dc9ff'],
  prefill = true,
  sway = false,
  className = '',
  style,
  children,
}) {
  const q = useQuality();
  const count = q === 'lite' ? Math.max(3, Math.round(rawCount * 0.45)) : rawCount;
  const items = useMemo(
    () =>
      makeList(count, seed, (rng, i) => ({
        i,
        size: between(rng, size[0], size[1]),
        dur: between(rng, duration[0], duration[1]),
        delay: between(rng, delay[0], delay[1]),
        x: between(rng, x[0], x[1]),
        y: between(rng, y[0], y[1]),
        rot: between(rng, -35, 35),
        hue: Math.round(between(rng, 0, 360)),
        color: colors[Math.floor(rng() * colors.length)],
        swayDur: between(rng, 3, 6),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count, seed],
  );

  const cls = ANIMS[anim] ?? '';
  const travels = anim === 'rise' || anim === 'fall';

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} style={style} aria-hidden="true">
      {items.map((p) => {
        const animStyle = {
          animationDuration: `${p.dur}s`,
          animationDelay: `${prefill ? -p.delay : p.delay}s`,
          ...(prefill ? null : { animationFillMode: 'backwards' }),
        };
        const pos = travels ? { left: `${p.x}%`, top: 0 } : { left: `${p.x}%`, top: `${p.y}%` };
        return (
          <div key={p.i} className={`absolute ${cls}`} style={{ ...pos, width: p.size, ...animStyle }}>
            {sway && travels ? (
              <div className="animate-sway" style={{ animationDuration: `${p.swayDur}s` }}>
                {children(p)}
              </div>
            ) : (
              children(p)
            )}
          </div>
        );
      })}
    </div>
  );
}
