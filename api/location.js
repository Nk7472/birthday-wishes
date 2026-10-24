import { isId } from '../shared/validate.js';
import { readBody, route, send, str, num } from './_util.js';
import { store } from './_store.js';
import { identify } from './_visitor.js';

const STATUS = ['granted', 'denied', 'blocked', 'off', 'unsupported', 'insecure'];

// POST /api/location   { vid, status, latitude?, longitude?, accuracy? }   the answer to the location request.
// When allowed it stores plain numbers (latitude, longitude) plus a GeoJSON point `loc` for "near me" queries later.
export default route(['POST'], async (req, res) => {
  const b = await readBody(req, 20_000);
  if (!isId(b.vid) || !STATUS.includes(b.status)) return send(res, 400, { error: 'Bad request' });
  const s = await store();
  const { uid } = await identify(req, s, b.vid);
  const doc = { uid, vid: b.vid, status: b.status, at: Date.now(), source: str(b.source, 30) };
  if (b.status === 'granted') {
    const latitude = num(b.latitude);
    const longitude = num(b.longitude);
    if (latitude === null || longitude === null || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return send(res, 400, { error: 'Bad coordinates' });
    doc.latitude = latitude;
    doc.longitude = longitude;
    doc.accuracy = num(b.accuracy);
    doc.loc = { type: 'Point', coordinates: [longitude, latitude] };
  }
  await s.addLocation(doc);
  send(res, 200, { ok: true, uid });
});
