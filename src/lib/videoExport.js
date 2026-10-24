// "Download video": films the scene frame by frame on a virtual clock, then plays the frames back in
// real time into a MediaRecorder together with the replayed music/effects.
//
//   phase 1  film()    step the scene on a virtual clock and take a snapshot every 1/24 s (or fewer on slow phones)
//   phase 2  encode()  replay the frames onto a canvas + the sound log into a recorder -> MP4/WebM
//
// Time budget: the whole export aims to finish in about a minute and a half. While filming, the speed is
// measured and quality steps down (smaller frames, then fewer frames per second) whenever the projected
// time would run over, so slow phones finish in time instead of crawling.

import { beginDryRun, endDryRun, getRecordingStream, replayAudio, setMuted, startMusic, stopMusic, unlockAudio } from './audio';
import { runPlan } from './autoplay';
import { advance, clockNow, installClock, realFrame, settle, uninstallClock, real } from './vclock';
import { CssPruner, collectCss, createEncoder, createSnapshotter, embedFonts, freezeAnimations } from './snapshot';

export const FPS = 24;

/** quality ladder: [output width px, frames per second] */
const LADDER = [
  [540, 24],
  [480, 24],
  [432, 20],
  [384, 16],
  [324, 12],
  [288, 10],
  [252, 8],
];

const MIMES = [
  ['video/mp4;codecs=avc1.640028,mp4a.40.2', 'mp4'],
  ['video/mp4;codecs=avc1,mp4a.40.2', 'mp4'],
  ['video/webm;codecs=vp9,opus', 'webm'],
  ['video/webm;codecs=vp8,opus', 'webm'],
  ['video/webm', 'webm'],
];
export const pickMime = () => (typeof MediaRecorder === 'undefined' ? null : MIMES.find(([m]) => MediaRecorder.isTypeSupported(m)) || null);
export const canExport = () => !!pickMime() && !!HTMLCanvasElement.prototype.captureStream;

const cancelled = () => new Error('cancelled');
const sleep = (ms) => new Promise((r) => real.setTimeout(r, ms));
const within = (p, ms, fallback) => Promise.race([p, sleep(ms).then(() => fallback)]);

/**
 * Phase 1. `mountScene()` must render the scene into `root` (it is called AFTER the virtual clock is installed so
 * that every timer the scene creates is virtual).
 * @param o.onStage(label)       what is happening now (shown to the person)
 * @param o.onProgress(p, info)  p in 0..1 of the filming phase; info = { v, total, fps, w, etaMs, share }
 * @param o.profile              'auto' | 'fast' (fast starts at the bottom of the ladder and skips web fonts)
 * @param o.budgetMs             how long filming may take
 */
export async function film({ root, tpl, text, mountScene, onStage, onProgress, onPreview, shouldStop, profile = 'auto', budgetMs }) {
  const width = root.offsetWidth;
  const height = root.offsetHeight;
  const seconds = (tpl.video?.seconds || 15) + 0.8;
  const totalMs = seconds * 1000;
  const budget = budgetMs || Math.max(35000, 90000 - seconds * 1000);
  const stats = { frames: 0, downgrades: 0 };
  let encoder = null;
  const frames = [];

  installClock();
  beginDryRun(clockNow);
  try {
    onStage?.('Loading the scene');
    mountScene();
    await settle(6);
    await within(realFrame(), 1500);
    await within(realFrame(), 1500);
    if (document.fonts?.ready) await within(document.fonts.ready, 2500);
    await settle(4);
    if (shouldStop()) throw cancelled();

    runPlan(root, tpl.video?.taps || []);
    startMusic(tpl.music, tpl.tempo, tpl.song);

    onStage?.('Preparing');
    const cssText = await within(collectCss(), 5000, '');
    const fonts = profile === 'fast' ? '' : await within(embedFonts(text), 6000, '');
    const pruner = new CssPruner(cssText + fonts);
    encoder = await createEncoder();
    if (shouldStop()) throw cancelled();

    let level = profile === 'fast' ? LADDER.length - 3 : 0;
    const make = () => {
      const [w, fps] = LADDER[level];
      const outW = Math.round(w / 2) * 2;
      const outH = Math.round((w * height) / width / 2) * 2;
      return { snap: createSnapshotter({ root, css: pruner, width, height, outW, outH }), step: 1000 / fps, fps, outW, outH };
    };
    let cur = make();
    const first = { w: cur.outW, h: cur.outH };

    onStage?.('Filming');
    const t0 = real.perfNow();
    let v = 0;
    let winStart = t0;
    let winV = 0;
    let cooldown = 6;
    let share = 0.75;
    let lastShown = 0;
    let fails = 0;
    while (v <= totalMs) {
      if (shouldStop()) throw cancelled();
      if (frames.length) {
        advance(cur.step);
        v += cur.step;
        winV += cur.step;
      }
      await settle(3);
      const anims = freezeAnimations(root, clockNow());
      let p;
      try {
        p = encoder.encode(await cur.snap.frame(anims));
        fails = 0;
      } catch (e) {
        // one bad frame is not worth failing for: repeat the previous one
        if (!frames.length || ++fails > 3) throw e;
        p = frames[frames.length - 1].p;
      }
      frames.push({ p, t: v, w: cur.outW, h: cur.outH });
      stats.frames += 1;

      const now = real.perfNow();
      // adapt quality to the speed of this device
      if (--cooldown <= 0 && winV > 0) {
        const wallPerVirtual = (now - winStart) / winV; // recent cost of one ms of show
        const projected = wallPerVirtual * (totalMs - v);
        const left = budget - (now - t0);
        if (projected > left && level < LADDER.length - 1) {
          level += 1;
          stats.downgrades += 1;
          cur = make();
        }
        winStart = now;
        winV = 0;
        cooldown = 8;
        const castMs = now - t0 + wallPerVirtual * (totalMs - v);
        share = Math.min(0.93, Math.max(0.45, castMs / (castMs + seconds * 1000 + 3000)));
      }
      if (now - lastShown > 120 || v >= totalMs) {
        lastShown = now;
        const rate = v > 0 ? (now - t0) / v : 0;
        onProgress?.(Math.min(1, v / totalMs), { v, total: totalMs, fps: cur.fps, w: cur.outW, etaMs: rate * (totalMs - v), share });
        onPreview?.(cur.snap.canvas);
        await sleep(0); // let the screen update
      }
      if (v >= totalMs) break;
    }
    stopMusic();
    onStage?.('Finishing frames');
    const blobs = await Promise.all(frames.map((f) => f.p));
    if (typeof window !== 'undefined' && window.__WB_DEBUG) console.info('film stats', JSON.stringify({ ...stats, level, ms: real.perfNow() - t0 }));
    return { frames: frames.map((f, i) => ({ blob: blobs[i], t: f.t })), log: endDryRun(), w: first.w, h: first.h, ms: totalMs };
  } catch (e) {
    endDryRun();
    throw e;
  } finally {
    encoder?.close();
    uninstallClock();
  }
}

/** Phase 2. Plays the frames back in real time into a recorder. Resolves { blob, ext, mime }. */
export async function encode({ frames, log, w, h, ms, onProgress, shouldStop }) {
  const picked = pickMime();
  if (!picked) throw new Error('This browser cannot record video.');
  const [mimeType, ext] = picked;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext('2d', { alpha: false });
  const stream = canvas.captureStream(0);
  const track = stream.getVideoTracks()[0];
  unlockAudio();
  setMuted(false);
  const audio = getRecordingStream();
  audio?.getAudioTracks().forEach((t) => stream.addTrack(t));

  const rec = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 4_000_000, audioBitsPerSecond: 128_000 });
  const chunks = [];
  rec.ondataavailable = (e) => e.data && e.data.size && chunks.push(e.data);
  const stopped = new Promise((resolve) => (rec.onstop = resolve));

  // decode ahead so drawing never waits
  const ahead = new Map();
  const bitmap = (i) => {
    if (!ahead.has(i) && i < frames.length) ahead.set(i, createImageBitmap(frames[i].blob));
    return ahead.get(i);
  };
  g.fillStyle = '#000';
  g.fillRect(0, 0, w, h);
  g.drawImage(await bitmap(0), 0, 0, w, h);

  rec.start(1000);
  const cancelAudio = replayAudio(log);
  const t0 = real.perfNow();
  let drawn = -1;
  const lastIdx = frames.length - 1;
  try {
    await new Promise((resolve, reject) => {
      let ptr = 0;
      const tick = async () => {
        if (shouldStop()) return reject(cancelled());
        const el = real.perfNow() - t0;
        while (ptr < lastIdx && frames[ptr + 1].t <= el) ptr += 1;
        if (ptr !== drawn) {
          for (let k = 1; k <= 6; k++) bitmap(ptr + k);
          const bmp = await bitmap(ptr);
          g.drawImage(bmp, 0, 0, w, h);
          track.requestFrame?.();
          bmp.close?.();
          ahead.delete(ptr);
          drawn = ptr;
        }
        onProgress?.(Math.min(1, el / (ms + 250)));
        if (el >= ms + 250) return resolve();
        real.raf(tick);
      };
      tick();
    });
  } finally {
    cancelAudio();
  }
  rec.stop();
  await stopped;
  stream.getTracks().forEach((t) => t.stop());
  return { blob: new Blob(chunks, { type: mimeType.split(';')[0] }), ext, mime: mimeType };
}
