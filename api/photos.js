import { isId } from '../shared/validate.js';
import { MAX_PHOTO, imageType, savePhoto } from './_gallery.js';
import { readRaw, route, send, sendBinary, sessionUid } from './_util.js';
import { store } from './_store.js';
import { identify } from './_visitor.js';

// POST /api/photos?vid=...   body = the photo file itself (image/jpeg bytes)  ->  { id }
// GET  /api/photos?id=...    the photo file back (image/jpeg), only for the person who owns it
export default route(['POST', 'GET'], async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const s = await store();

  if (req.method === 'POST') {
    const vid = url.searchParams.get('vid');
    if (!isId(vid)) return send(res, 400, { error: 'Bad visitor id' });
    const bytes = await readRaw(req, MAX_PHOTO + 1);
    const type = imageType(bytes);
    if (!type || bytes.length > MAX_PHOTO) return send(res, 400, { error: 'That is not a usable photo.' });
    const { uid } = await identify(req, s, vid);
    const id = await savePhoto(s, { uid, vid, bytes, type });
    return send(res, 200, { ok: true, id, size: bytes.length });
  }

  const id = url.searchParams.get('id') || '';
  const uid = sessionUid(req);
  if (!/^[a-f0-9]{32}$/.test(id)) return send(res, 400, { error: 'Bad id' });
  if (!uid) return send(res, 401, { error: 'Please log in.' });
  const p = await s.getPhoto(id);
  if (!p || p.uid !== uid) return send(res, 404, { error: 'Not found' });
  const b = p.bytes;
  const buf = Buffer.isBuffer(b) ? b : Buffer.from(b?.buffer || b);
  // the id is a hash of the content, so the file can be cached for good
  sendBinary(res, 200, buf, p.type || 'image/jpeg', { 'Cache-Control': 'private, max-age=31536000, immutable' });
});
