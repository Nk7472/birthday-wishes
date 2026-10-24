// Background sending. The page never waits for the network: things to send are queued, sent one at a time when the
// browser is idle, retried with growing pauses when the network or server hiccups, and the queue survives a reload.
// While a video is being made the queue pauses so it never competes with filming.
import { setUid } from './api';

const KEY = 'wishbox:outbox:v1';
const MAX_KEPT = 60;

let paused = 0;
let busy = false;
let timer = 0;
let fails = 0;
const mem = []; // { url, body, tries }

try {
  const saved = JSON.parse(localStorage.getItem(KEY) || '[]');
  if (Array.isArray(saved)) mem.push(...saved.slice(-MAX_KEPT));
} catch (e) {
  /* ignore */
}
const persist = () => {
  try {
    if (mem.length) localStorage.setItem(KEY, JSON.stringify(mem.slice(-MAX_KEPT)));
    else localStorage.removeItem(KEY);
  } catch (e) {
    /* full or blocked: the queue still works in memory */
  }
};

const idle = (fn) => ('requestIdleCallback' in window ? window.requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 50));

async function pump() {
  if (busy || paused || !mem.length || (typeof navigator !== 'undefined' && navigator.onLine === false)) return;
  busy = true;
  const item = mem[0];
  try {
    const res = await fetch(item.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: item.body, keepalive: item.body.length < 60000, credentials: 'same-origin' });
    // 4xx means the server refused this item for good: drop it. 5xx / network means try again.
    if (res.ok) res.json().then((d) => d?.uid && setUid(d.uid)).catch(() => {}); // the server says which "user12_…" folder this is
    if (res.ok || (res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429)) {
      mem.shift();
      fails = 0;
    } else throw new Error(`HTTP ${res.status}`);
  } catch (e) {
    fails += 1;
    item.tries = (item.tries || 0) + 1;
    if (item.tries > 8) mem.shift(); // give up on one stubborn item rather than block the rest
  }
  persist();
  busy = false;
  if (mem.length) schedule(fails ? Math.min(60000, 2000 * 2 ** (fails - 1)) : 0);
}

function schedule(delay = 0) {
  clearTimeout(timer);
  timer = setTimeout(() => idle(pump), delay);
}

/** Queue a JSON POST. Returns immediately. */
export function enqueue(url, payload) {
  mem.push({ url, body: JSON.stringify(payload), tries: 0 });
  persist();
  schedule(0);
}

/** Pause sending (e.g. while filming a video). Returns the function that resumes it. */
export function pauseOutbox() {
  paused += 1;
  let done = false;
  return () => {
    if (done) return;
    done = true;
    paused = Math.max(0, paused - 1);
    if (!paused) schedule(300);
  };
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => schedule(0));
  schedule(1500); // anything left from the last visit
}

/** Resolves when nothing heavy (like filming a video) is running, so uploads wait their turn. */
export function whenClear() {
  return new Promise((resolve) => {
    const check = () => (paused ? setTimeout(check, 500) : resolve());
    check();
  });
}
