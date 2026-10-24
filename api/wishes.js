import { isId } from '../shared/validate.js';
import { readBody, route, send, str } from './_util.js';
import { store } from './_store.js';
import { identify } from './_visitor.js';

const STAGES = { details: 'detailsDone', preview: 'previewed', download: 'downloaded', share: 'shared', export: 'exported' };

// POST /api/wishes   { vid, wid, stage, wish }   the friend's details + the template used, saved at each milestone.
export default route(['POST'], async (req, res) => {
  const b = await readBody(req, 50_000);
  if (!isId(b.vid) || !isId(b.wid) || !b.wish || typeof b.wish !== 'object') return send(res, 400, { error: 'Bad request' });
  const s = await store();
  const { uid } = await identify(req, s, b.vid);
  const w = b.wish;
  const now = Date.now();
  const photoId = /^[a-f0-9]{32}$/.test(w.photoId || '') ? w.photoId : null;
  const set = {
    updatedAt: now,
    category: str(w.category, 20),
    name: str(w.name, 60),
    age: str(w.age, 6),
    reason: str(w.reason, 80),
    from: str(w.from, 60),
    message: str(w.message, 600),
    wishes: (Array.isArray(w.wishes) ? w.wishes : []).slice(0, 3).map((x) => str(x, 120)),
    frame: w.frame === 'square' ? 'square' : 'circle',
    template: str(w.template, 40),
    photoId,
  };
  const flag = STAGES[b.stage];
  // a template counts as "used" once it has been previewed, downloaded or shared
  const used = flag && flag !== 'detailsDone' ? set.template : '';
  await s.putWish(b.wid, uid, { vid: b.vid, createdAt: now }, set, flag ? [flag] : [], used);
  send(res, 200, { ok: true });
});
