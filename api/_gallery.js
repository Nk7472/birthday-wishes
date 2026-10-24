// Friend photos are real image files (JPEG/PNG/WebP bytes), stored once and kept forever.
import { sha } from './_util.js';

export const MAX_PHOTO = 1_500_000; // bytes

/** Look at the first bytes, not at what the client claims. */
export function imageType(buf) {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf[0] === 0x89 && buf.toString('ascii', 1, 4) === 'PNG') return 'image/png';
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

/** Idempotent: the same picture from the same person is stored once. Returns its id. */
export async function savePhoto(s, { uid, vid, bytes, type }) {
  const id = sha(`${uid}|${sha(bytes.toString('latin1'))}`).slice(0, 32);
  await s.putPhoto({ _id: id, uid, vid, bytes, type, size: bytes.length, createdAt: Date.now() });
  return id;
}
