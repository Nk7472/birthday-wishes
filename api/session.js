import { isId } from '../shared/validate.js';
import { readBody, route, send } from './_util.js';
import { store } from './_store.js';
import { identify, touchDevice } from './_visitor.js';

// POST /api/session   { vid, ...details }  ->  { ok, uid }   (the app sends these inside /api/events; kept for older pages)
export default route(['POST'], async (req, res) => {
  const b = await readBody(req, 20_000);
  if (!isId(b.vid)) return send(res, 400, { error: 'Bad visitor id' });
  const s = await store();
  const who = await identify(req, s, b.vid);
  await touchDevice(s, req, who, b.vid, b);
  send(res, 200, { ok: true, uid: who.uid });
});
