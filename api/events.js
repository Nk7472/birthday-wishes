import { isId } from '../shared/validate.js';
import { cleanProps, readBody, route, send, str } from './_util.js';
import { store } from './_store.js';
import { identify, touchDevice } from './_visitor.js';

// POST /api/events   { vid, session?, events: [{ t, n, s, p }] }  ->  { ok, saved, uid }
// One request carries the browser's details (first call of a visit) AND its latest clicks, saved in parallel.
export default route(['POST'], async (req, res) => {
  const b = await readBody(req, 200_000);
  if (!isId(b.vid) || !Array.isArray(b.events)) return send(res, 400, { error: 'Bad request' });
  const s = await store();
  const who = await identify(req, s, b.vid);
  const now = Date.now();
  const docs = b.events.slice(0, 100).map((e) => {
    const t = Number(e?.t);
    return {
      uid: who.uid,
      vid: b.vid,
      name: str(e?.n, 40),
      screen: str(e?.s, 30),
      props: cleanProps(e?.p),
      ts: Number.isFinite(t) && Math.abs(t - now) < 864e5 * 2 ? t : now,
      at: now,
    };
  }).filter((d) => d.name);
  await Promise.all([s.addEvents(who.uid, docs), b.session && typeof b.session === 'object' ? touchDevice(s, req, who, b.vid, b.session) : null]);
  send(res, 200, { ok: true, saved: docs.length, uid: who.uid });
});
