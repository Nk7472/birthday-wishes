// Turns the live scene into an image, one frame at a time, without screen capture.
//
//   1. clone the scene's DOM
//   2. freeze every running animation at its current frame and write the animated values into the clone
//   3. wrap it in an SVG <foreignObject> together with the page's CSS and the fonts it uses
//   4. let the browser rasterise that SVG, draw it onto a canvas, and encode a JPEG
//
// Nothing here needs permission prompts, and it works on phones (unlike getDisplayMedia).

import { fontSheets } from './fonts';
import { real } from './vclock';

const SKIP_KEYS = new Set(['offset', 'easing', 'composite', 'computedOffset']);
const kebab = (k) => (k.startsWith('--') ? k : k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`));

/** All CSS of the page that we can read (our bundle), as one string. */
export async function collectCss() {
  let out = '';
  for (const sheet of document.styleSheets) {
    let rules;
    try {
      rules = sheet.cssRules;
    } catch (e) {
      // not readable as rules: for our own linked stylesheet, fetch its text instead
      if (sheet.href && !/fonts\.googleapis\.com/.test(sheet.href)) {
        try {
          out += `${await (await fetch(sheet.href)).text()}\n`;
        } catch (err) {
          /* skip */
        }
      }
      continue;
    }
    for (const r of rules) out += `${r.cssText}\n`;
  }
  return out;
}

const toDataUrl = async (url) => {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(blob);
  });
};

function inRanges(range, codes) {
  if (!range) return true;
  const parts = range.split(',').map((p) => p.trim().replace(/^U\+/i, ''));
  return parts.some((p) => {
    if (p.includes('?')) {
      const lo = parseInt(p.replace(/\?/g, '0'), 16);
      const hi = parseInt(p.replace(/\?/g, 'F'), 16);
      return codes.some((c) => c >= lo && c <= hi);
    }
    const [a, b] = p.split('-');
    const lo = parseInt(a, 16);
    const hi = b ? parseInt(b, 16) : lo;
    return codes.some((c) => c >= lo && c <= hi);
  });
}

/**
 * The scene's display fonts as base64 @font-face rules (an SVG image cannot fetch fonts itself).
 * Only the unicode ranges that the given text actually needs are embedded.
 */
export async function embedFonts(text, sheets = fontSheets) {
  const codes = [...new Set([...`${text}0123456789 .,!?'’-—♥…&`].map((c) => c.codePointAt(0)))];
  const cache = new Map();
  let css = '';
  for (const href of sheets) {
    let sheet;
    try {
      sheet = await (await fetch(href)).text();
    } catch (e) {
      continue;
    }
    for (const m of sheet.matchAll(/@font-face\s*{[^}]*}/g)) {
      const block = m[0];
      const range = (block.match(/unicode-range:\s*([^;]+);/) || [])[1];
      if (!inRanges(range, codes)) continue;
      const url = (block.match(/url\(([^)]+)\)/) || [])[1]?.replace(/['"]/g, '');
      if (!url) continue;
      try {
        if (!cache.has(url)) cache.set(url, await toDataUrl(url));
        css += block.replace(/src:[^;]+;/, `src: url(${cache.get(url)});`) + '\n';
      } catch (e) {
        /* font missing: the scene falls back to a system font */
      }
    }
  }
  return css;
}

/**
 * The page CSS is ~190 KB (every Tailwind class of every scene). Each frame only needs the rules whose
 * classes exist in the scene right now, so rules are filtered by class names (cheap and conservative:
 * a rule is dropped only if one of its classes appears nowhere in the scene so far). @keyframes are
 * dropped entirely because animations are frozen and written inline.
 */
export class CssPruner {
  constructor(cssText) {
    this.items = [];
    this.seen = new Set();
    this.cache = '';
    this.cacheSize = -1;
    const sheet = new CSSStyleSheet();
    try {
      sheet.replaceSync(cssText);
    } catch (e) {
      this.items = [{ text: cssText, classes: [] }];
      return;
    }
    const walk = (rules, wrap) => {
      for (const r of rules) {
        const t = r.constructor.name;
        if (t === 'CSSKeyframesRule') continue;
        if (t === 'CSSStyleRule') {
          const sel = r.selectorText;
          const keepAlways = /:not\(|:is\(|:where\(|:has\(/.test(sel);
          const classes = keepAlways ? [] : [...sel.matchAll(/\.((?:\\.|[\w-])+)/g)].map((m) => m[1].replace(/\\(.)/g, '$1'));
          this.items.push({ text: wrap(r.cssText), classes });
        } else if (r.cssRules && (t === 'CSSMediaRule' || t === 'CSSSupportsRule' || t === 'CSSLayerBlockRule' || t === 'CSSContainerRule')) {
          const head = r.cssText.slice(0, r.cssText.indexOf('{')).trim();
          walk(r.cssRules, (inner) => wrap(`${head} { ${inner} }`));
        } else {
          this.items.push({ text: wrap(r.cssText), classes: [] });
        }
      }
    };
    walk(sheet.cssRules, (x) => x);
  }

  cssFor(root) {
    let grew = false;
    const note = (el) => {
      const c = el.getAttribute('class');
      if (!c) return;
      for (const tok of c.split(/\s+/)) if (tok && !this.seen.has(tok)) (this.seen.add(tok), (grew = true));
    };
    note(root);
    root.querySelectorAll('[class]').forEach(note);
    if (grew || this.cacheSize < 0) {
      this.cache = this.items.filter((it) => it.classes.every((c) => this.seen.has(c))).map((it) => it.text).join('\n');
      this.cacheSize = this.seen.size;
    }
    return this.cache;
  }
}

const animatedProps = new WeakMap();
function propsOf(anim) {
  let p = animatedProps.get(anim);
  if (p) return p;
  p = [];
  try {
    if (anim.transitionProperty) p = [anim.transitionProperty];
    else {
      const set = new Set();
      anim.effect.getKeyframes().forEach((kf) => Object.keys(kf).forEach((k) => !SKIP_KEYS.has(k) && set.add(k)));
      p = [...set];
    }
  } catch (e) {
    p = [];
  }
  animatedProps.set(anim, p);
  return p;
}

/**
 * Freeze animations on the scene at virtual time `t` (ms). Animations are paused the first time they are
 * seen; from then on their position is simply (t - born). Returns the list of frozen animations.
 */
const born = new WeakMap();
export function freezeAnimations(root, t) {
  const list = [];
  for (const a of document.getAnimations()) {
    const el = a.effect && a.effect.target;
    if (!el || !root.contains(el)) continue;
    if (!born.has(a)) {
      born.set(a, t);
      a.pause();
    }
    a.currentTime = t - born.get(a);
    list.push(a);
  }
  return list;
}

/**
 * @param root    the element holding the scene
 * @param o.css   page CSS + embedded fonts
 * @param o.width/height  CSS px size of root
 * @param o.out   output pixel width (height follows)
 */
export function createSnapshotter({ root, css, width, height, outW, outH }) {
  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const g = canvas.getContext('2d', { alpha: false });
  const cs0 = getComputedStyle(document.body);
  const wrapStyle = `position:relative;width:${width}px;height:${height}px;overflow:hidden;container-type:size;font-family:${cs0.fontFamily};color:${cs0.color};font-size:${cs0.fontSize};line-height:${cs0.lineHeight};`;
  const pruner = css instanceof CssPruner ? css : null;
  const fixed = pruner ? '' : css;
  const ser = new XMLSerializer();
  const scratch = document.createElement('canvas');
  const scratchG = scratch.getContext('2d');
  const scale = outW / width;
  const shrunk = new Map();

  return {
    canvas,
    stats: { clone: 0, ser: 0, decode: 0, jpeg: 0 },
    /** Render the scene as it is right now. Resolves the canvas it was drawn on. */
    async frame(anims) {
      const st = this.stats;
      let t0 = real.perfNow();
      const origs = [root, ...root.querySelectorAll('*')];
      const clone = root.cloneNode(true);
      const clones = [clone, ...clone.querySelectorAll('*')];
      const index = new Map();
      origs.forEach((el, i) => index.set(el, i));

      // animated values -> inline styles
      const done = new Set();
      for (const a of anims) {
        const el = a.effect.target;
        if (a.effect.pseudoElement) continue;
        const i = index.get(el);
        if (i === undefined) continue;
        const target = clones[i];
        const cs = getComputedStyle(el);
        for (const prop of propsOf(a)) {
          const key = `${i}|${prop}`;
          if (done.has(key)) continue;
          done.add(key);
          const name = kebab(prop);
          target.style.setProperty(name, cs.getPropertyValue(name));
        }
      }
      // backface-visibility: the SVG renderer does not hide faces that point away, so work it out here
      // (sign of the z axis after every transform from the element up to the scene) and hide those clones
      root.querySelectorAll('[style*="backface"]').forEach((el) => {
        if (getComputedStyle(el).backfaceVisibility !== 'hidden') return;
        let m = new DOMMatrix();
        for (let n = el; n && n !== root.parentElement; n = n.parentElement) {
          const tr = getComputedStyle(n).transform;
          if (tr && tr !== 'none') m = new DOMMatrix(tr).multiply(m);
        }
        if (m.m33 < 0) {
          const target = clones[index.get(el)];
          if (target) target.style.setProperty('visibility', 'hidden', 'important');
        }
      });
      // canvases -> images (the confetti layer is drawn on top directly, below)
      const tops = [];
      const cvs = root.querySelectorAll('canvas');
      cvs.forEach((c) => {
        const i = index.get(c);
        const target = clones[i];
        if (!target || !c.width || !c.height) return;
        if (c.dataset.snap === 'top') {
          target.remove();
          tops.push(c);
          return;
        }
        // encode at most 1 pixel per CSS pixel: plenty for a 540px-wide video, and ~2x faster than full DPR
        let src = c;
        const cw = Math.min(c.width, Math.round(c.clientWidth || c.width));
        const ch = Math.min(c.height, Math.round(c.clientHeight || c.height));
        if (cw < c.width) {
          scratch.width = cw;
          scratch.height = ch;
          scratchG.clearRect(0, 0, cw, ch);
          scratchG.drawImage(c, 0, 0, cw, ch);
          src = scratch;
        }
        const img = document.createElement('img');
        img.setAttribute('src', src.toDataURL('image/webp', 0.8));
        img.setAttribute('style', c.getAttribute('style') || '');
        img.setAttribute('class', c.getAttribute('class') || '');
        target.replaceWith(img);
      });
      // big photos: every frame embeds the picture again, so hand the renderer one sized for the video instead
      root.querySelectorAll('img').forEach((im) => {
        const src = im.getAttribute('src') || '';
        if (src.length < 24000 || !src.startsWith('data:') || !im.naturalWidth) return;
        const r = im.getBoundingClientRect();
        const want = Math.min(1, (Math.max(r.width, r.height, 32) * Math.max(1, scale) * 1.5) / Math.max(im.naturalWidth, im.naturalHeight));
        const q = Math.min(1, Math.ceil(want * 8) / 8); // snap, so a photo that grows does not re-encode every frame
        if (q >= 0.95) return;
        const key = `${src.length}:${src.slice(-40)}:${q}`;
        let small = shrunk.get(key);
        if (!small) {
          scratch.width = Math.max(2, Math.round(im.naturalWidth * q));
          scratch.height = Math.max(2, Math.round(im.naturalHeight * q));
          scratchG.drawImage(im, 0, 0, scratch.width, scratch.height);
          small = scratch.toDataURL('image/jpeg', 0.86);
          shrunk.set(key, small);
        }
        const target = clones[index.get(im)];
        if (target) target.setAttribute('src', small);
      });
      // form state does not clone
      clone.querySelectorAll('input,textarea').forEach((n) => n.remove());
      st.clone += real.perfNow() - t0;

      t0 = real.perfNow();
      const body = ser.serializeToString(clone);
      const sheet = `${pruner ? pruner.cssFor(root) : fixed}\n*,*::before,*::after{animation:none!important;transition:none!important}`;
      const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" width="${outW}" height="${outH}" viewBox="0 0 ${width} ${height}">` +
        `<style><![CDATA[${sheet}]]></style>` +
        `<foreignObject x="0" y="0" width="${width}" height="${height}">` +
        `<div xmlns="http://www.w3.org/1999/xhtml" style="${wrapStyle.replace(/"/g, "'")}">${body}</div>` +
        `</foreignObject></svg>`;
      const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
      st.ser += real.perfNow() - t0;

      t0 = real.perfNow();
      const img = new Image();
      img.decoding = 'sync';
      await new Promise((resolve, reject) => {
        const guard = real.setTimeout(() => reject(new Error('frame timed out')), 15000);
        img.onload = () => {
          real.clearTimeout(guard);
          resolve();
        };
        img.onerror = () => {
          real.clearTimeout(guard);
          reject(new Error('snapshot failed'));
        };
        img.src = url;
      });
      g.fillStyle = '#000';
      g.fillRect(0, 0, outW, outH);
      g.drawImage(img, 0, 0, outW, outH);
      img.onload = img.onerror = null;
      img.src = ''; // let go of the decoded picture right away (a frame is a big one)
      const rootBox = root.getBoundingClientRect();
      tops.forEach((c) => {
        const b = c.getBoundingClientRect();
        g.drawImage(c, ((b.left - rootBox.left) / rootBox.width) * outW, ((b.top - rootBox.top) / rootBox.height) * outH, (b.width / rootBox.width) * outW, (b.height / rootBox.height) * outH);
      });
      st.decode += real.perfNow() - t0;

      return canvas;
    },
    scale,
  };
}

/**
 * JPEG encoding is the slowest part of a frame, so it runs on background threads while the next
 * frame is being drawn. Falls back to the main thread when workers / OffscreenCanvas are missing.
 */
const WORKER_SRC = `
onmessage = async (e) => {
  const { id, bitmap, q, ping } = e.data;
  if (ping) { postMessage({ id, pong: true }); return; }
  try {
    const c = new OffscreenCanvas(bitmap.width, bitmap.height);
    c.getContext('2d').drawImage(bitmap, 0, 0);
    bitmap.close();
    const blob = await c.convertToBlob({ type: 'image/jpeg', quality: q });
    postMessage({ id, blob });
  } catch (err) {
    postMessage({ id, error: String(err) });
  }
};`;

const mainThreadEncoder = (quality) => ({
  encode: (canvas) => new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality)),
  close() {},
});

/**
 * JPEG encoding runs on background threads while the next frame is drawn. A handshake at start-up checks that
 * the workers really answer; if not (or if Worker / OffscreenCanvas are missing) encoding happens on the main thread.
 */
export async function createEncoder({ quality = 0.86, threads } = {}) {
  const canWorker = typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined' && typeof createImageBitmap === 'function';
  if (!canWorker) return mainThreadEncoder(quality);
  const n = threads || Math.max(1, Math.min(3, (navigator.hardwareConcurrency || 4) - 1));
  let url;
  let pool;
  try {
    url = URL.createObjectURL(new Blob([WORKER_SRC], { type: 'text/javascript' }));
    pool = Array.from({ length: n }, () => new Worker(url));
  } catch (e) {
    return mainThreadEncoder(quality);
  }
  const pending = new Map();
  let nextId = 1;
  let turn = 0;
  let inflight = 0;
  let broken = false;
  const waiters = [];
  const fail = (err) => {
    broken = true;
    pending.forEach((p) => p.reject(err));
    pending.clear();
    waiters.splice(0).forEach((w) => w());
  };
  pool.forEach((wk) => {
    wk.onerror = () => fail(new Error('encoder worker failed'));
    wk.onmessage = (e) => {
      const { id, blob, error, pong } = e.data;
      const p = pending.get(id);
      pending.delete(id);
      if (!pong) inflight -= 1;
      if (waiters.length) waiters.shift()();
      if (!p) return;
      if (error || (!blob && !pong)) p.reject(new Error(error || 'encode failed'));
      else p.resolve(blob || true);
    };
  });
  const close = () => {
    pool.forEach((wk) => wk.terminate());
    URL.revokeObjectURL(url);
  };
  // handshake
  try {
    await Promise.all(
      pool.map(
        (wk) =>
          new Promise((resolve, reject) => {
            const id = nextId++;
            const guard = real.setTimeout(() => reject(new Error('worker silent')), 3000);
            pending.set(id, { resolve: (v) => (real.clearTimeout(guard), resolve(v)), reject });
            wk.postMessage({ id, ping: true });
          }),
      ),
    );
  } catch (e) {
    close();
    return mainThreadEncoder(quality);
  }
  return {
    async encode(canvas) {
      while (inflight >= n * 3 && !broken) await new Promise((r) => waiters.push(r)); // bound memory
      if (broken) throw new Error('encoder worker failed');
      const bitmap = await createImageBitmap(canvas);
      const id = nextId++;
      inflight += 1;
      const p = new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
      pool[turn++ % pool.length].postMessage({ id, bitmap, q: quality }, [bitmap]);
      return p;
    },
    close,
  };
}
