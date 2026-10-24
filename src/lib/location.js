// Asking for the person's location. Called straight from a tap (Chrome only shows its dialog then).
//
//   1. ask the browser (Chrome's own dialog; on Android Chrome also offers to switch device location on)
//   2. save the coordinates in our database (latitude + longitude, plain numbers)
//   3. only then does the caller go full screen and start the preview
import { getVid } from './api';
import { enqueue } from './outbox';
import { track } from './track';

let last = null; // { latitude, longitude, accuracy, at } for this visit
export const lastLocation = () => last;

async function permission() {
  try {
    const s = await navigator.permissions?.query({ name: 'geolocation' });
    return s?.state || 'unknown'; // granted | prompt | denied
  } catch (e) {
    return 'unknown';
  }
}

const GEO = { enableHighAccuracy: false, timeout: 20000, maximumAge: 10 * 60 * 1000 };

/** Save one answer. Waits for the server briefly (so the data is in the database before the preview starts), then
 *  carries on in the background: a slow server never traps the person. */
async function save(status, pos) {
  const body = { vid: getVid(), status, source: 'preview' };
  if (pos) Object.assign(body, { latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy || 0) });
  const send = fetch('/api/location', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), credentials: 'same-origin', keepalive: true })
    .then((r) => r.ok)
    .catch(() => false);
  const ok = await Promise.race([send, new Promise((r) => setTimeout(() => r(false), 4000))]);
  if (!ok) enqueue('/api/location', body); // retried in the background until it is stored
  return ok;
}

/**
 * Resolves { ok: true } when the preview may start (location known and saved), or { ok: false, reason }:
 *   'denied'   they tapped "Don't allow" just now            -> teddy asks again nicely
 *   'blocked'  Chrome/iOS remembers "Never allow" (no dialog can open) -> show how to unblock it
 *   'off'      allowed, but the phone's location is switched off / no position -> show how to turn it on
 */
export async function askLocation() {
  if (!('geolocation' in navigator)) {
    track('location_unsupported');
    save('unsupported');
    return { ok: true, skipped: 'unsupported' };
  }
  if (window.isSecureContext === false) {
    // Chrome only allows location on https:// (or localhost). Nothing can be asked on a plain http:// address.
    track('location_insecure');
    save('insecure');
    console.warn('[wishbox] Location needs https:// or localhost. Skipping the location step on this address.');
    return { ok: true, skipped: 'insecure' };
  }
  const before = await permission();
  const started = performance.now();
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        last = { latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy, at: Date.now() };
        track('location_granted');
        const saved = await save('granted', pos);
        resolve({ ok: true, saved });
      },
      async (err) => {
        let reason;
        if (err.code === 1) {
          // answered at once while the browser already says "denied" => no dialog could open: the choice is remembered
          reason = before === 'denied' && performance.now() - started < 500 ? 'blocked' : 'denied';
        } else {
          reason = 'off'; // position unavailable (location switched off, no signal) or took too long
        }
        track(`location_${reason}`);
        save(reason === 'off' ? 'off' : reason);
        resolve({ ok: false, reason });
      },
      GEO,
    );
  });
}
