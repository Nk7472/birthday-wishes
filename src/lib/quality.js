// Adaptive quality. Scenes are built to run at full fidelity, but phones differ a lot,
// so a tiny frame-time monitor drops to a "lite" level (fewer floating particles, lower
// canvas resolution, lighter confetti) whenever the device cannot keep ~40 fps.
// It only ever steps down during a session, never flickers back up.
import { useSyncExternalStore } from 'react';

const lowEnd = () =>
  typeof navigator !== 'undefined' && ((navigator.deviceMemory && navigator.deviceMemory <= 3) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4));

let level = lowEnd() ? 'lite' : 'high';
const subs = new Set();

function apply() {
  if (typeof document !== 'undefined') document.documentElement.dataset.quality = level;
}
apply();

export const getQuality = () => level;
export const isLite = () => level === 'lite';

export function setQuality(next) {
  if (next === level) return;
  level = next;
  apply();
  subs.forEach((f) => f());
}

export function useQuality() {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => level,
  );
}

/** Watch real frame pacing for a while; call the returned function to stop. */
export function watchFrames({ windowMs = 2200, slowMs = 27 } = {}) {
  let raf = 0;
  let stopped = false;
  let last = 0;
  let sum = 0;
  let n = 0;
  let start = 0;
  const tick = (now) => {
    if (stopped) return;
    if (!start) start = now;
    if (last) {
      const d = now - last;
      if (d < 250) {
        sum += d;
        n += 1;
      }
    }
    last = now;
    if (now - start >= windowMs) {
      if (n > 20 && sum / n > slowMs) setQuality('lite');
      sum = 0;
      n = 0;
      start = now;
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
  };
}
