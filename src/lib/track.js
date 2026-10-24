// Everything a visitor does is reported to our database under their temporary id (see lib/api.js getVid).
// Clicks are captured automatically (every button), and key moments add their own named events.
import { getVid, isReturning } from './api';
import { enqueue } from './outbox';
import { detectPlatform, detectPlatformFull } from './platform';

const queue = [];
let screen = 'home';
let timer = 0;
let started = false;
let errors = 0;

let hello = null; // the visitor's details, sent once with the first batch of a visit

function flush(unloading = false) {
  clearTimeout(timer);
  timer = 0;
  if (!queue.length && !hello) return;
  const events = queue.splice(0, 100);
  const payload = { vid: getVid(), events, ...(hello ? { session: hello } : {}) };
  hello = null;
  try {
    if (unloading && navigator.sendBeacon) {
      // the page is closing: hand it to the browser, which finishes the send after the page is gone
      navigator.sendBeacon('/api/events', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
    } else {
      enqueue('/api/events', payload); // queued, retried and sent in the background
    }
  } catch (e) {
    /* tracking must never break the app */
  }
}

/** Report something that happened. Props must be flat and small. Never put personal text in here. */
export function track(name, props) {
  queue.push({ t: Date.now(), n: name, s: screen, p: props });
  if (queue.length >= 15) flush();
  else if (!timer) timer = setTimeout(flush, 3500);
}

export function setScreen(name) {
  if (name === screen) return;
  screen = name;
  track('screen', { screen: name });
}

const CLICKABLE = 'button, a[href], [role="button"], [role="option"], [role="tab"], summary, label[for]';
function labelOf(el) {
  if (el.closest('[data-private]')) return '';
  let t = el.getAttribute('data-track') || el.getAttribute('aria-label') || el.textContent || '';
  t = t.replace(/\s+/g, ' ').trim();
  if (/^Profile:/i.test(t)) t = 'Profile'; // the label carries the person's name
  return t.slice(0, 40);
}

/** Tell the server about this browser (platform, language…); used at load and again after a log out makes a new visitor. */
function sayHello() {
  const gift = window.location.hash.startsWith('#/w/');
  const base = {
    returning: isReturning(),
    lang: navigator.language,
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    sw: window.screen?.width,
    sh: window.screen?.height,
    standalone: window.matchMedia?.('(display-mode: standalone)').matches,
    ref: document.referrer,
    landing: gift ? 'gift' : 'home',
  };
  hello = { ...base, ...detectPlatform() };
  detectPlatformFull().then((p) => (hello ? (hello = { ...hello, ...p }) : null)); // adds the phone model when Chrome knows it
  track('app_open', { gift, returning: isReturning(), os: detectPlatform().os });
  setTimeout(() => flush(), 600); // the visitor row is saved within a second of opening the site
}

/** After logging out this browser is a new visitor: say hello again so it gets its own folder and device row. */
export const newVisit = () => started && sayHello();

export function startTracking() {
  if (started || typeof window === 'undefined') return;
  started = true;
  sayHello();

  document.addEventListener(
    'click',
    (e) => {
      const el = e.target instanceof Element ? e.target.closest(CLICKABLE) : null;
      if (!el) return;
      track('click', { label: labelOf(el), tag: el.tagName.toLowerCase() });
    },
    true,
  );
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && flush(true));
  window.addEventListener('pagehide', () => flush(true));
  window.addEventListener('error', (e) => {
    if (errors++ < 5) track('js_error', { msg: String(e.message || '').slice(0, 120) });
  });
}
