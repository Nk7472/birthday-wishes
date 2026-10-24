import { route, send, sessionUid } from './_util.js';
import { store } from './_store.js';

// GET /api/gallery   everything this person has made: every photo ever uploaded + every wish with its templates.
export default route(['GET'], async (req, res) => {
  const uid = sessionUid(req);
  if (!uid) return send(res, 401, { error: 'Please log in.' });
  const { photos, wishes } = await (await store()).gallery(uid);
  send(res, 200, {
    photos: photos.map((p) => ({ id: p._id, at: p.createdAt, size: p.size || 0 })),
    wishes: wishes.map((w) => ({
      id: w._id, name: w.name, age: w.age, reason: w.reason || '', from: w.from, message: w.message, wishes: w.wishes || [], category: w.category,
      template: w.template, templates: w.templates || [], photoId: w.photoId || null, frame: w.frame,
      flags: w.flags || {}, createdAt: w.createdAt, updatedAt: w.updatedAt,
    })),
  });
});
