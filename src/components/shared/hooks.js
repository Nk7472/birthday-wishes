import { useEffect, useRef, useState } from 'react';
import { getLevel } from '../../lib/audio';

/**
 * Scripted timeline. cues = timestamps in ms since mount.
 * Returns how many cues have fired, so:
 *   const step = useTimeline([0, 1200, 3200]);
 *   step >= 1  -> immediately      step >= 2 -> after 1.2s     step >= 3 -> after 3.2s
 * Safe to use for anything: show/hide, trigger sfx / confetti in an effect.
 */
export function useTimeline(cues, { active = true } = {}) {
  const [step, setStep] = useState(0);
  const key = cues.join(',');
  useEffect(() => {
    if (!active) return undefined;
    setStep(0);
    const ids = cues.map((ms, i) => setTimeout(() => setStep(i + 1), ms));
    return () => ids.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, active]);
  return step;
}

/** Typewriter text. Restarts whenever `text` changes. */
export function useTyped(text, { speed = 42, delay = 0, active = true } = {}) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    if (!active) return undefined;
    let iv;
    const start = setTimeout(() => {
      let i = 0;
      iv = setInterval(() => {
        i += 1;
        setN(i);
        if (i >= text.length) clearInterval(iv);
      }, speed);
    }, delay);
    return () => {
      clearTimeout(start);
      clearInterval(iv);
    };
  }, [text, speed, delay, active]);
  return { text: text.slice(0, n), done: n >= text.length, progress: text.length ? n / text.length : 1 };
}

/** Eased count-up from 0 to `to`. */
export function useCountUp(to, { duration = 1800, delay = 0, active = true } = {}) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!active) return undefined;
    setV(0);
    let raf;
    let t0;
    const timer = setTimeout(() => {
      const tick = (now) => {
        if (!t0) t0 = now;
        const p = Math.min(1, (now - t0) / duration);
        setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [to, duration, delay, active]);
  return v;
}

/**
 * A ref whose .current is the live loudness (0..1) of the birthday music,
 * updated every frame without re-rendering. Read it inside your own rAF/canvas
 * loop. It is 0 when muted/locked, so always keep a CSS fallback animation.
 */
export function useAudioLevelRef() {
  const ref = useRef(0);
  useEffect(() => {
    let raf;
    const tick = () => {
      ref.current = getLevel();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return ref;
}

/** requestAnimationFrame loop. cb(now, dt) with dt in seconds. */
export function useRaf(cb, active = true) {
  const saved = useRef(cb);
  saved.current = cb;
  useEffect(() => {
    if (!active) return undefined;
    let raf;
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      saved.current(now, dt);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);
}

/** Run fn once after `ms` (cleans up on unmount). */
export function useTimeout(fn, ms, active = true) {
  const saved = useRef(fn);
  saved.current = fn;
  useEffect(() => {
    if (!active) return undefined;
    const id = setTimeout(() => saved.current(), ms);
    return () => clearTimeout(id);
  }, [ms, active]);
}
