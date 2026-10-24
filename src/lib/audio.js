// Web Audio engine — no audio files needed. Synthesises the "Happy Birthday"
// melody (with a waltz accompaniment) in several instrument styles, plus sfx.
//
// Browsers only allow audio after a user gesture, so the viewer calls
// unlockAudio() when the gift is opened. Before that every call is a no-op.

let ctx = null;
let master = null;
let bus = null;
let analyser = null;
let analyserData = null;
let noiseBuf = null;
let muted = false;

const music = { playing: false, timer: null, gain: null, preset: null, tempo: null, song: null, loop: 24, spb: 0, events: null, next: null };
let recComp = null;
// Dry-run: used while a video is being filmed frame by frame. Nothing is played; every call is logged with
// the (virtual) time it happened at, and replayed later in real time into the recorder.
let dry = null;
export function beginDryRun(nowFn) {
  dry = { log: [], now: nowFn };
}
export function endDryRun() {
  const log = dry ? dry.log : [];
  dry = null;
  return log;
}
export const isDryRun = () => !!dry;

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

function makeImpulse(c, seconds = 1.4, decay = 3) {
  const len = Math.floor(c.sampleRate * seconds);
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return buf;
}

function makeNoise(c) {
  const len = c.sampleRate * 2;
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function ensureCtx() {
  if (typeof window === 'undefined') return null;
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.9;
  const comp = ctx.createDynamicsCompressor();
  recComp = comp;
  analyser = ctx.createAnalyser();
  analyser.fftSize = 128;
  analyserData = new Uint8Array(analyser.frequencyBinCount);
  master.connect(comp);
  comp.connect(analyser);
  comp.connect(ctx.destination);

  bus = ctx.createGain();
  bus.connect(master);
  const conv = ctx.createConvolver();
  conv.buffer = makeImpulse(ctx);
  const wet = ctx.createGain();
  wet.gain.value = 0.22;
  bus.connect(conv);
  conv.connect(wet);
  wet.connect(master);
  noiseBuf = makeNoise(ctx);
  return ctx;
}

/** Call from a user gesture (tap/click). Returns true if audio is available. */
export function unlockAudio() {
  const c = ensureCtx();
  if (!c) return false;
  if (c.state === 'suspended') c.resume();
  return true;
}

export function setMuted(m) {
  muted = !!m;
  if (master && ctx) master.gain.setTargetAtTime(muted ? 0 : 0.9, ctx.currentTime, 0.05);
}
export const isMuted = () => muted;

/** 0..1 loudness of whatever is playing right now (0 when silent/locked). */
export function getLevel() {
  if (dry) return 0.32 + 0.22 * Math.sin(dry.now() / 170);
  if (!analyser || muted) return 0;
  analyser.getByteFrequencyData(analyserData);
  let sum = 0;
  for (let i = 0; i < analyserData.length; i++) sum += analyserData[i];
  return Math.min(1, sum / analyserData.length / 110);
}

/* ------------------------------------------------------------------ */
/* Instruments                                                         */
/* ------------------------------------------------------------------ */

const VOICES = {
  musicbox: { layers: [{ type: 'sine', m: 1, g: 1 }, { type: 'sine', m: 3, g: 0.22 }, { type: 'triangle', m: 2, g: 0.18 }], a: 0.003, decay: 1.6, sustain: 0.0001, rel: 0.05, ring: true, vol: 1 },
  piano: { layers: [{ type: 'triangle', m: 1, g: 1 }, { type: 'sine', m: 2, g: 0.35 }, { type: 'sine', m: 3, g: 0.12 }], a: 0.006, decay: 1.1, sustain: 0.12, rel: 0.25, lp: 3200, ring: true, vol: 1 },
  chiptune: { layers: [{ type: 'square', m: 1, g: 0.5 }], a: 0.004, decay: 0.12, sustain: 0.4, rel: 0.04, vol: 0.55 },
  synth: { layers: [{ type: 'sawtooth', m: 1, g: 0.5, d: -7 }, { type: 'sawtooth', m: 1, g: 0.5, d: 7 }, { type: 'square', m: 0.5, g: 0.3 }], a: 0.02, decay: 0.3, sustain: 0.5, rel: 0.3, lp: 2100, vol: 0.7 },
  bell: { layers: [{ type: 'sine', m: 1, g: 1 }, { type: 'sine', m: 2.76, g: 0.35 }, { type: 'sine', m: 5.4, g: 0.12 }], a: 0.002, decay: 2.4, sustain: 0.0001, rel: 0.1, ring: true, vol: 0.9 },
  pad: { layers: [{ type: 'sawtooth', m: 1, g: 0.4, d: -9 }, { type: 'sawtooth', m: 1, g: 0.4, d: 9 }, { type: 'triangle', m: 0.5, g: 0.4 }], a: 0.12, decay: 0.4, sustain: 0.6, rel: 0.6, lp: 1300, vol: 0.75 },
  pluck: { layers: [{ type: 'triangle', m: 1, g: 1 }, { type: 'sine', m: 2, g: 0.3 }], a: 0.003, decay: 0.55, sustain: 0.0001, rel: 0.05, lp: 2600, ring: true, vol: 1 },
};

export const MUSIC_PRESETS = Object.keys(VOICES);

function playNote(preset, midi, t, dur, vol, dest) {
  const v = VOICES[preset] || VOICES.musicbox;
  const c = ctx;
  const f = mtof(midi);
  const peak = Math.max(vol * v.vol, 0.0002);
  const sus = Math.max(peak * v.sustain, 0.0001);
  const decayT = v.ring ? v.decay : Math.min(v.decay, Math.max(dur - v.a, 0.05));
  const hold = v.ring ? 0 : Math.max(0, dur - v.a - decayT);
  const end = t + v.a + decayT + hold + v.rel;

  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + v.a);
  g.gain.exponentialRampToValueAtTime(sus, t + v.a + decayT);
  g.gain.setValueAtTime(sus, t + v.a + decayT + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, end);

  let out = g;
  if (v.lp) {
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = v.lp;
    g.connect(lp);
    out = lp;
  }
  out.connect(dest);

  v.layers.forEach((l) => {
    const o = c.createOscillator();
    o.type = l.type;
    o.frequency.setValueAtTime(f * l.m, t);
    if (l.d) o.detune.value = l.d;
    const lg = c.createGain();
    lg.gain.value = l.g;
    o.connect(lg);
    lg.connect(g);
    o.start(t);
    o.stop(end + 0.05);
  });
}

// "Happy Birthday to You" — [midi, beats], 3/4 time, key of C
const MELODY = [
  [67, 0.75], [67, 0.25], [69, 1], [67, 1], [72, 1], [71, 2],
  [67, 0.75], [67, 0.25], [69, 1], [67, 1], [74, 1], [72, 2],
  [67, 0.75], [67, 0.25], [79, 1], [76, 1], [72, 1], [71, 1], [69, 1],
  [77, 0.75], [77, 0.25], [76, 1], [72, 1], [74, 1], [72, 2],
];
// An original slow love theme, 4/4, key of C
const LOVE_MELODY = [
  [76, 1.5], [79, 0.5], [76, 1], [72, 1],
  [69, 1], [72, 1], [76, 2],
  [77, 1.5], [76, 0.5], [72, 2],
  [74, 1], [71, 1], [74, 2],
  [76, 1.5], [79, 0.5], [84, 1], [79, 1],
  [76, 1], [74, 1], [71, 2],
  [77, 1.5], [76, 0.5], [74, 1], [72, 1],
  [74, 2], [72, 2],
];
// An original warm "thank you" theme, 4/4, key of C
const THANKS_MELODY = [
  [72, 1], [76, 1], [79, 1.5], [76, 0.5],
  [74, 1], [71, 1], [67, 2],
  [69, 1], [72, 1], [76, 1.5], [72, 0.5],
  [77, 1], [74, 1], [72, 2],
  [72, 1], [76, 1], [79, 1], [84, 1],
  [81, 1.5], [79, 0.5], [77, 2],
  [79, 1], [77, 1], [74, 1], [71, 1],
  [72, 2], [79, 1], [72, 1],
];
const CHORDS = {
  C: { bass: 48, tones: [60, 64, 67] },
  G: { bass: 43, tones: [55, 59, 62] },
  G7: { bass: 43, tones: [59, 62, 65] },
  F: { bass: 41, tones: [57, 60, 65] },
  Am: { bass: 45, tones: [57, 60, 64] },
  Em: { bass: 40, tones: [55, 59, 64] },
};
const SONGS = {
  birthday: { melody: MELODY, bars: ['C', 'G7', 'G7', 'C', 'C', 'G7', 'F', 'C'], bpb: 3, loop: 24, accomp: 'waltz' },
  thanks: { melody: THANKS_MELODY, bars: ['C', 'G', 'Am', 'F', 'C', 'F', 'G', 'C'], bpb: 4, loop: 32, accomp: 'bounce' },
  love: { melody: LOVE_MELODY, bars: ['C', 'Am', 'F', 'G', 'C', 'Em', 'F', 'G'], bpb: 4, loop: 32, accomp: 'arp' },
};

/** Flatten the song into timed events once per preset (beats from loop start). */
const eventCache = {};
function buildEvents(preset, songName) {
  const key = `${songName}:${preset}`;
  if (eventCache[key]) return eventCache[key];
  const song = SONGS[songName] || SONGS.birthday;
  const ev = [];
  let b = 0;
  song.melody.forEach(([m, beats]) => {
    ev.push({ b, midi: m, beats: beats * 0.95, vol: 0.2, preset });
    b += beats;
  });
  song.bars.forEach((name, bar) => {
    const ch = CHORDS[name];
    const bt = bar * song.bpb;
    if (preset === 'pad') {
      [ch.bass + 12, ...ch.tones].forEach((m) => ev.push({ b: bt, midi: m, beats: song.bpb, vol: 0.05, preset: 'pad' }));
      return;
    }
    if (song.accomp === 'bounce') {
      ev.push({ b: bt, midi: ch.bass, beats: 1.5, vol: 0.11, preset });
      ev.push({ b: bt + 2, midi: ch.bass + 7, beats: 1.5, vol: 0.08, preset });
      [1, 3].forEach((k) => ch.tones.forEach((m) => ev.push({ b: bt + k, midi: m, beats: 0.6, vol: 0.035, preset })));
      return;
    }
    if (song.accomp === 'arp') {
      ev.push({ b: bt, midi: ch.bass, beats: 2, vol: 0.11, preset });
      [1, 2, 3].forEach((k) => ev.push({ b: bt + k, midi: ch.tones[k - 1], beats: 0.95, vol: 0.04, preset }));
      return;
    }
    ev.push({ b: bt, midi: ch.bass, beats: 1, vol: 0.11, preset });
    [1, 2].forEach((k) => ch.tones.forEach((m) => ev.push({ b: bt + k, midi: m, beats: 0.55, vol: 0.035, preset })));
  });
  ev.sort((x, y) => x.b - y.b);
  const out = { events: ev, loop: song.loop };
  eventCache[key] = out;
  return out;
}

// Rolling look-ahead scheduler: only the next ~1.2 s of notes exist as audio
// nodes at any moment, so the audio thread and main thread stay idle between
// ticks (the old version created a whole loop's worth of nodes in one burst).
const LOOKAHEAD = 1.2;
const TICK_MS = 150;

function tick() {
  if (!music.playing || !ctx || ctx.state !== 'running') return;
  const { events, spb } = music;
  const horizon = ctx.currentTime + LOOKAHEAD;
  while (music.next.t < horizon) {
    const e = events[music.next.i];
    const t = music.next.base + e.b * spb;
    if (t >= ctx.currentTime - 0.02) playNote(e.preset, e.midi, Math.max(t, ctx.currentTime), e.beats * spb, e.vol, music.gain);
    music.next.i += 1;
    if (music.next.i >= events.length) {
      music.next.i = 0;
      music.next.base += (music.loop + 1.5) * spb;
    }
    const n = events[music.next.i];
    music.next.t = music.next.base + n.b * spb;
  }
}

export function startMusic(preset = 'musicbox', tempo = 96, song = 'birthday') {
  if (dry) {
    dry.log.push({ t: dry.now(), k: '#start', a: [preset, tempo, song] });
    return;
  }
  const c = ensureCtx();
  if (!c) return;
  // Already playing exactly this? Leave it alone (no restart, no glitch).
  if (music.playing && music.preset === preset && music.tempo === tempo && music.song === song) return;
  stopMusic();
  if (c.state === 'suspended') c.resume();
  const built = buildEvents(preset, song);
  const events = built.events;
  const base = c.currentTime + 0.15;
  music.playing = true;
  music.preset = preset;
  music.tempo = tempo;
  music.song = song;
  music.loop = built.loop;
  music.spb = 60 / tempo;
  music.events = events;
  music.next = { i: 0, base, t: base + events[0].b * music.spb };
  music.gain = c.createGain();
  music.gain.gain.value = 1;
  music.gain.connect(bus);
  tick();
  music.timer = setInterval(tick, TICK_MS);
}

export function stopMusic() {
  if (dry) {
    dry.log.push({ t: dry.now(), k: '#stop', a: [] });
    return;
  }
  const wasPlaying = music.playing;
  music.playing = false;
  music.preset = null;
  music.tempo = null;
  music.song = null;
  clearInterval(music.timer);
  music.timer = null;
  if (music.gain && ctx) {
    const g = music.gain;
    g.gain.cancelScheduledValues(ctx.currentTime);
    g.gain.setValueAtTime(g.gain.value, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + (wasPlaying ? 0.18 : 0.02));
    setTimeout(() => {
      try { g.disconnect(); } catch (e) { /* already gone */ }
    }, 1500);
  }
  music.gain = null;
}

/** Pause audio when the tab is hidden, resume (and re-sync) when it returns. */
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) {
      if (music.playing) ctx.suspend();
    } else if (music.playing && ctx.state === 'suspended') {
      ctx.resume();
    }
  });
}

/** A MediaStream carrying everything the engine plays (for video export). */
let recDest = null;
export function getRecordingStream() {
  const c = ensureCtx();
  if (!c) return null;
  if (!recDest) {
    recDest = c.createMediaStreamDestination();
    recComp.connect(recDest);
  }
  return recDest.stream;
}

export const isMusicPlaying = () => music.playing;

/* ------------------------------------------------------------------ */
/* Sound effects                                                       */
/* ------------------------------------------------------------------ */

const live = () => (ctx && ctx.state === 'running' && !muted ? ctx : null);

function noiseBurst({ t, dur = 0.2, type = 'bandpass', f = 1500, q = 1, vol = 0.3, to }) {
  const c = ctx;
  const src = c.createBufferSource();
  src.buffer = noiseBuf;
  const flt = c.createBiquadFilter();
  flt.type = type;
  flt.frequency.setValueAtTime(f, t);
  if (to) flt.frequency.exponentialRampToValueAtTime(to, t + dur);
  flt.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(flt);
  flt.connect(g);
  g.connect(bus);
  src.start(t, Math.random() * 1.5);
  src.stop(t + dur + 0.05);
}

function blip({ type = 'sine', f, t, dur = 0.2, vol = 0.3, to }) {
  const c = ctx;
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(bus);
  o.start(t);
  o.stop(t + dur + 0.05);
}

const PENTA = [1046.5, 1174.7, 1318.5, 1568, 1760, 2093];

export const sfx = {
  pop() {
    const c = live(); if (!c) return;
    const t = c.currentTime;
    noiseBurst({ t, dur: 0.09, type: 'highpass', f: 900, vol: 0.5 });
    blip({ f: 240, to: 60, t, dur: 0.12, vol: 0.45 });
  },
  sparkle() {
    const c = live(); if (!c) return;
    const t = c.currentTime;
    for (let i = 0; i < 5; i++) {
      blip({ f: PENTA[Math.floor(Math.random() * PENTA.length)], t: t + i * 0.055, dur: 0.35, vol: 0.09 });
    }
  },
  boom() {
    const c = live(); if (!c) return;
    const t = c.currentTime;
    blip({ f: 150, to: 28, t, dur: 0.9, vol: 0.55 });
    noiseBurst({ t, dur: 0.8, type: 'lowpass', f: 600, vol: 0.45 });
  },
  crackle() {
    const c = live(); if (!c) return;
    const t = c.currentTime;
    for (let i = 0; i < 14; i++) {
      noiseBurst({ t: t + Math.random() * 0.7, dur: 0.03, type: 'highpass', f: 3000, vol: 0.18 });
    }
  },
  coin() {
    const c = live(); if (!c) return;
    const t = c.currentTime;
    blip({ type: 'square', f: 988, t, dur: 0.08, vol: 0.12 });
    blip({ type: 'square', f: 1319, t: t + 0.08, dur: 0.28, vol: 0.12 });
  },
  whoosh() {
    const c = live(); if (!c) return;
    noiseBurst({ t: c.currentTime, dur: 0.6, type: 'bandpass', f: 300, to: 3200, q: 0.8, vol: 0.28 });
  },
  blow() {
    const c = live(); if (!c) return;
    noiseBurst({ t: c.currentTime, dur: 0.7, type: 'lowpass', f: 800, vol: 0.4 });
  },
  chime(f = 880) {
    const c = live(); if (!c) return;
    const t = c.currentTime;
    blip({ f, t, dur: 1.4, vol: 0.18 });
    blip({ f: f * 2.76, t, dur: 0.8, vol: 0.05 });
  },
  tada() {
    const c = live(); if (!c) return;
    const t = c.currentTime;
    [523.3, 659.3, 784, 1046.5].forEach((f, i) => blip({ type: 'triangle', f, t: t + i * 0.09, dur: 0.9, vol: 0.2 }));
    noiseBurst({ t: t + 0.3, dur: 0.5, type: 'highpass', f: 5000, vol: 0.12 });
  },
  kick() {
    const c = live(); if (!c) return;
    blip({ f: 160, to: 40, t: c.currentTime, dur: 0.25, vol: 0.6 });
  },
  tick() {
    const c = live(); if (!c) return;
    blip({ type: 'square', f: 1800, t: c.currentTime, dur: 0.03, vol: 0.06 });
  },
  /* --- cartoon / comedy effects (used by Funny Teddy) --- */
  boing() {
    const c = live(); if (!c) return;
    const t = c.currentTime;
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(620, t + 0.09);
    o.frequency.exponentialRampToValueAtTime(190, t + 0.26);
    o.frequency.exponentialRampToValueAtTime(480, t + 0.36);
    o.frequency.exponentialRampToValueAtTime(150, t + 0.62);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.4, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.66);
    o.connect(g); g.connect(bus);
    o.start(t); o.stop(t + 0.7);
  },
  squeak(f = 1500) {
    const c = live(); if (!c) return;
    const t = c.currentTime;
    blip({ type: 'square', f: f * 0.7, to: f * 1.5, t, dur: 0.07, vol: 0.1 });
    blip({ type: 'square', f: f * 1.2, to: f * 0.8, t: t + 0.07, dur: 0.09, vol: 0.1 });
  },
  honk() {
    const c = live(); if (!c) return;
    const t = c.currentTime;
    blip({ type: 'sawtooth', f: 340, to: 300, t, dur: 0.38, vol: 0.14 });
    blip({ type: 'sawtooth', f: 352, to: 308, t, dur: 0.38, vol: 0.12 });
  },
  slide(dir = 'down') {
    const c = live(); if (!c) return;
    const t = c.currentTime;
    const [a, b] = dir === 'down' ? [1900, 260] : [260, 1900];
    blip({ f: a, to: b, t, dur: 0.75, vol: 0.2 });
    blip({ f: a * 1.01, to: b * 1.01, t, dur: 0.75, vol: 0.08 });
  },
  partyHorn() {
    const c = live(); if (!c) return;
    const t = c.currentTime;
    noiseBurst({ t, dur: 0.5, type: 'bandpass', f: 1200, to: 3000, q: 1.2, vol: 0.18 });
    blip({ type: 'square', f: 740, to: 1180, t, dur: 0.45, vol: 0.1 });
    blip({ type: 'triangle', f: 1480, to: 2300, t: t + 0.04, dur: 0.4, vol: 0.06 });
  },
  drumroll(dur = 1.2) {
    const c = live(); if (!c) return;
    const t = c.currentTime;
    const n = Math.round(dur / 0.045);
    for (let i = 0; i < n; i++) noiseBurst({ t: t + i * 0.045, dur: 0.05, type: 'bandpass', f: 320, q: 0.8, vol: 0.05 + (0.22 * i) / n });
  },
  womp() {
    const c = live(); if (!c) return;
    const t = c.currentTime;
    [[311, 0.32], [294, 0.32], [277, 0.32], [262, 0.9]].forEach(([f, d], i) => {
      const at = t + [0, 0.34, 0.68, 1.02][i];
      blip({ type: 'sawtooth', f, to: i === 3 ? f * 0.86 : f, t: at, dur: d, vol: 0.12 });
    });
  },
  rimshot() {
    const c = live(); if (!c) return;
    const t = c.currentTime;
    blip({ f: 220, to: 110, t, dur: 0.12, vol: 0.4 });
    blip({ f: 180, to: 90, t: t + 0.14, dur: 0.12, vol: 0.4 });
    noiseBurst({ t: t + 0.32, dur: 0.7, type: 'highpass', f: 6500, vol: 0.22 });
  },
  thud() {
    const c = live(); if (!c) return;
    const t = c.currentTime;
    blip({ f: 130, to: 38, t, dur: 0.22, vol: 0.6 });
    noiseBurst({ t, dur: 0.12, type: 'lowpass', f: 500, vol: 0.35 });
  },
  munch() {
    const c = live(); if (!c) return;
    const t = c.currentTime;
    [0, 0.16, 0.32].forEach((d) => noiseBurst({ t: t + d, dur: 0.09, type: 'lowpass', f: 900, to: 300, vol: 0.4 }));
  },
  sneeze() {
    const c = live(); if (!c) return;
    const t = c.currentTime;
    noiseBurst({ t, dur: 0.5, type: 'bandpass', f: 700, to: 2200, q: 1.4, vol: 0.09 });
    noiseBurst({ t: t + 0.65, dur: 0.5, type: 'bandpass', f: 800, to: 2600, q: 1.4, vol: 0.12 });
    const k = t + 1.4;
    noiseBurst({ t: k, dur: 0.3, type: 'highpass', f: 1200, vol: 0.7 });
    blip({ type: 'sawtooth', f: 520, to: 140, t: k, dur: 0.3, vol: 0.18 });
  },
  cheer() {
    const c = live(); if (!c) return;
    const t = c.currentTime;
    [[900, 2400], [1300, 3200], [600, 1800]].forEach(([a, b], i) => noiseBurst({ t: t + i * 0.12, dur: 1.1, type: 'bandpass', f: a, to: b, q: 0.6, vol: 0.2 }));
  },
};

// While filming (dry-run) every effect is logged instead of played.
Object.keys(sfx).forEach((k) => {
  const play = sfx[k];
  sfx[k] = (...a) => {
    if (dry) {
      dry.log.push({ t: dry.now(), k, a });
      return undefined;
    }
    return play(...a);
  };
});

/** Play a dry-run log back in real time (so it lands in getRecordingStream()). Returns a cancel function. */
export function replayAudio(log) {
  const ids = log.map((e) =>
    setTimeout(() => {
      if (e.k === '#start') startMusic(...e.a);
      else if (e.k === '#stop') stopMusic();
      else sfx[e.k]?.(...e.a);
    }, Math.max(0, e.t)),
  );
  return () => {
    ids.forEach(clearTimeout);
    stopMusic();
  };
}
