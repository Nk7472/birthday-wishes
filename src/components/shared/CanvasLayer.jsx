import { useEffect, useRef } from 'react';
import { isLite } from '../../lib/quality';

/**
 * A full-size <canvas> with a managed animation loop (handles resize + retina).
 *
 *   <CanvasLayer
 *     setup={({ w, h }) => ({ stars: makeStars(w, h) })}          // returns your state
 *     draw={({ ctx, w, h, t, dt, state }) => { ... }}              // every frame, t = seconds
 *     onTap={({ x, y, state, w, h }) => { ... }}                   // optional (enables pointer events)
 *     className="absolute inset-0"
 *   />
 *
 * Coordinates are CSS pixels (already scaled for the device pixel ratio).
 * setup runs again if the canvas is resized so layouts stay correct.
 */
export default function CanvasLayer({ setup, draw, onTap, className = 'absolute inset-0', style }) {
  const ref = useRef(null);
  const fns = useRef({ setup, draw, onTap });
  fns.current = { setup, draw, onTap };

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    let w = 0;
    let h = 0;
    let state = {};
    let raf;
    let t0 = performance.now();
    let last = t0;

    const resize = () => {
      const dpr = Math.min(isLite() ? 1 : 1.5, window.devicePixelRatio || 1);
      const r = canvas.getBoundingClientRect();
      const nw = Math.max(1, Math.round(r.width));
      const nh = Math.max(1, Math.round(r.height));
      if (nw === w && nh === h) return;
      w = nw;
      h = nh;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      state = fns.current.setup ? fns.current.setup({ w, h, ctx }) || {} : {};
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const tick = (now) => {
      if (document.hidden) {
        last = now;
        raf = requestAnimationFrame(tick);
        return;
      }
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.save();
      fns.current.draw?.({ ctx, w, h, t: (now - t0) / 1000, dt, state });
      ctx.restore();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const down = (e) => {
      const r = canvas.getBoundingClientRect();
      fns.current.onTap?.({ x: e.clientX - r.left, y: e.clientY - r.top, state, w, h });
    };
    canvas.addEventListener('pointerdown', down);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('pointerdown', down);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className={`${className} ${onTap ? '' : 'pointer-events-none'}`}
      style={{ width: '100%', height: '100%', ...style }}
    />
  );
}
