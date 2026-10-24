// Saves the friend's photo (as a real JPEG file) and the wish details to our database, in the background.
// Removing a photo from a wish never deletes it there: every photo ever added stays in the person's gallery.
import { getVid } from './api';
import { enqueue, whenClear } from './outbox';

const uploads = new Map(); // photo (data URL) -> Promise<id | null>
const hires = new Map(); // photo (data URL) -> bigger JPEG Blob of the same crop
let chain = Promise.resolve();

export function rememberHires(dataUrl, blob) {
  hires.set(dataUrl, blob);
  if (hires.size > 8) hires.delete(hires.keys().next().value);
}

function dataUrlToBlob(url) {
  const [head, b64] = url.split(',');
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: /data:([^;]+)/.exec(head)?.[1] || 'image/jpeg' });
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function upload(photo) {
  const blob = hires.get(photo) || dataUrlToBlob(photo);
  for (let attempt = 0; attempt < 4; attempt++) {
    await whenClear(); // never while a video is being made
    try {
      // the body is the JPEG file itself, not JSON
      const res = await fetch(`/api/photos?vid=${encodeURIComponent(getVid())}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: blob,
        credentials: 'same-origin',
      });
      if (res.ok) return (await res.json()).id || null;
      if (res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429) return null;
    } catch (e) {
      /* offline: try again */
    }
    await wait([2000, 6000, 20000][attempt] || 0);
  }
  return null;
}

/** Upload once per picture. Resolves the photo's id (or null if it could not be saved). */
export function savePhoto(photo) {
  if (!photo || !photo.startsWith('data:image')) return Promise.resolve(null);
  if (!uploads.has(photo)) {
    const p = (chain = chain.then(() => upload(photo)).catch(() => null));
    uploads.set(photo, p);
    p.then((id) => !id && uploads.delete(photo)); // failed: allow another try later
  }
  return uploads.get(photo);
}

const timeout = (p, ms) => Promise.race([p, wait(ms).then(() => null)]);

/** stage: details | preview | download | share | export. Never blocks the caller. */
export async function saveWish(wish, stage) {
  if (!wish?.wid) return;
  const { wid, category, template, name, age, from, message, wishes, photo, frame, reason } = wish;
  if (!name?.trim() && !photo) return; // nothing worth keeping yet
  const photoId = photo ? await timeout(savePhoto(photo), 15000) : null;
  enqueue('/api/wishes', { vid: getVid(), wid, stage, wish: { category, template, name, age, from, message, wishes, photoId, frame, reason } });
}
