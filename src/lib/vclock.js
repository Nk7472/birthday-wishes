// A virtual clock. While a video is being filmed, the scene runs on this instead of real time:
// setTimeout / setInterval / requestAnimationFrame / performance.now / Date.now all read it, and it only
// moves when advance() is called. That makes filming deterministic: the show can be stepped
// 1/24 s at a time and each step can take as long as it needs without the scene falling behind.

const R = {
  setTimeout: window.setTimeout.bind(window),
  clearTimeout: window.clearTimeout.bind(window),
  setInterval: window.setInterval.bind(window),
  clearInterval: window.clearInterval.bind(window),
  raf: window.requestAnimationFrame.bind(window),
  caf: window.cancelAnimationFrame.bind(window),
  perfNow: performance.now.bind(performance),
  dateNow: Date.now.bind(Date),
};
export const real = R;

let on = false;
let now = 0; // ms of virtual time since install
let seq = 0;
let nextId = 1;
let perfBase = 0;
let dateBase = 0;
const timers = new Map(); // id -> { at, fn, args, every, seq }
let frames = []; // [{ id, cb }]

const patch = {
  setTimeout(fn, ms = 0, ...args) {
    if (typeof fn !== 'function') return 0;
    const id = nextId++;
    timers.set(id, { at: now + Math.max(0, Number(ms) || 0), fn, args, every: 0, seq: seq++ });
    return id;
  },
  setInterval(fn, ms = 0, ...args) {
    if (typeof fn !== 'function') return 0;
    const id = nextId++;
    const every = Math.max(1, Number(ms) || 1);
    timers.set(id, { at: now + every, fn, args, every, seq: seq++ });
    return id;
  },
  clear(id) {
    timers.delete(id);
  },
  raf(cb) {
    const id = nextId++;
    frames.push({ id, cb });
    return id;
  },
  caf(id) {
    frames = frames.filter((f) => f.id !== id);
  },
};

export function installClock() {
  if (on) return;
  on = true;
  now = 0;
  timers.clear();
  frames = [];
  perfBase = R.perfNow();
  dateBase = R.dateNow();
  window.setTimeout = patch.setTimeout;
  window.setInterval = patch.setInterval;
  window.clearTimeout = patch.clear;
  window.clearInterval = patch.clear;
  window.requestAnimationFrame = patch.raf;
  window.cancelAnimationFrame = patch.caf;
  performance.now = () => perfBase + now;
  Date.now = () => dateBase + Math.round(now);
}

export function uninstallClock() {
  if (!on) return;
  on = false;
  window.setTimeout = R.setTimeout;
  window.setInterval = R.setInterval;
  window.clearTimeout = R.clearTimeout;
  window.clearInterval = R.clearInterval;
  window.requestAnimationFrame = R.raf;
  window.cancelAnimationFrame = R.caf;
  performance.now = R.perfNow;
  Date.now = R.dateNow;
  timers.clear();
  frames = [];
}

export const clockNow = () => now;

/** Move virtual time forward by dt ms: fire due timers in order, then one animation frame. */
export function advance(dt) {
  const target = now + dt;
  for (let guard = 0; guard < 5000; guard++) {
    let best = null;
    let bestId = 0;
    timers.forEach((t, id) => {
      if (t.at <= target && (!best || t.at < best.at || (t.at === best.at && t.seq < best.seq))) {
        best = t;
        bestId = id;
      }
    });
    if (!best) break;
    now = Math.max(now, best.at);
    if (best.every) {
      best.at += best.every;
      best.seq = seq++;
    } else {
      timers.delete(bestId);
    }
    try {
      best.fn(...best.args);
    } catch (e) {
      // a scene bug must not stop filming
      console.error(e);
    }
  }
  now = target;
  const run = frames;
  frames = [];
  const stamp = perfBase + now;
  run.forEach((f) => {
    try {
      f.cb(stamp);
    } catch (e) {
      console.error(e);
    }
  });
}

/** Let React (which schedules on its own real MessageChannel) commit what the timers just changed. */
export function settle(rounds = 4) {
  let p = Promise.resolve();
  for (let i = 0; i < rounds; i++) {
    p = p.then(
      () =>
        new Promise((resolve) => {
          const c = new MessageChannel();
          c.port1.onmessage = () => {
            c.port1.close();
            resolve();
          };
          c.port2.postMessage(0);
        }),
    );
  }
  return p;
}

export const realFrame = () => new Promise((resolve) => R.raf(() => resolve()));
