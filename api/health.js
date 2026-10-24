import { explainDbError, route, send } from './_util.js';
import { store } from './_store.js';

// GET /api/health  ->  { ok, store: "mongo" | "memory" }   open this in the browser to check the database is connected.
// When it cannot connect it says why (in plain English) instead of failing.
export default route(['GET'], async (req, res) => {
  const mongo = !!process.env.MONGODB_URI;
  try {
    const s = await store();
    send(res, 200, { ok: true, store: s.kind, ...(s.kind === 'memory' ? { note: 'MONGODB_URI is not set, so data is only kept in memory.' } : {}) });
  } catch (e) {
    console.error('[wishbox api] health check failed:', e);
    send(res, 200, { ok: false, store: mongo ? 'mongo' : 'memory', problem: explainDbError(e) });
  }
});
