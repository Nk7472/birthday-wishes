import { cleanPhone, isId, validEmail } from '../shared/validate.js';
import { checkPassword, hashPassword, readBody, route, send, sessionUid, setSession, str } from './_util.js';
import { store } from './_store.js';
import { identify } from './_visitor.js';

const pub = (u) => ({ id: u._id, uid: u._id, name: u.name, email: u.email, phone: u.phone || '', created: u.createdAt });
const MAX_FAILS = 8;
const LOCK_MS = 10 * 60 * 1000;

// GET  /api/auth            -> { user | null }       (who is logged in, from the cookie)
// POST /api/auth {action}   signup | login | logout
export default route(['GET', 'POST'], async (req, res) => {
  const s = await store();
  if (req.method === 'GET') {
    const uid = sessionUid(req);
    const u = uid ? await s.authById(uid) : null;
    if (!u) setSession(req, res, null);
    return send(res, 200, { user: u ? pub(u) : null });
  }

  const b = await readBody(req, 20_000);
  const vid = isId(b.vid) ? b.vid : null;

  if (b.action === 'logout') {
    setSession(req, res, null);
    return send(res, 200, { ok: true });
  }

  if (b.action === 'signup') {
    const name = str(b.name, 40);
    const email = str(b.email, 120).toLowerCase();
    const phone = cleanPhone(str(b.dial, 6) || '+91', b.phone);
    const password = typeof b.password === 'string' ? b.password : '';
    if (name.length < 2) return send(res, 400, { error: 'Please enter your name.' });
    if (password.length < 6 || password.length > 100) return send(res, 400, { error: 'Choose a password with at least 6 characters.' });
    if (!phone) return send(res, 400, { error: 'Enter a valid phone number.' });
    if (!validEmail(email)) return send(res, 400, { error: 'Enter a valid email address.' });
    if (!vid) return send(res, 400, { error: 'Please reload the page and try again.' });
    // this browser's own folder id becomes the account id: everything collected so far already belongs to it
    const { uid } = await identify(req, s, vid);
    const user = { _id: uid, uid, name, email, phone, passHash:password, createdAt: Date.now(), fails: 0 };
    try {
      await s.createAuth(user);
    } catch (e) {
      if (e.code === 'EXISTS') return send(res, 409, { error: 'An account with this email already exists. Try logging in.' });
      if (e.code === 'HAS_ACCOUNT') return send(res, 409, { error: 'This device already has a profile. Please log in instead.' });
      throw e;
    }
    setSession(req, res, uid);
    return send(res, 200, { user: pub(user) });
  }

  if (b.action === 'login') {
    const email = str(b.email, 120).toLowerCase();
    const password = typeof b.password === 'string' ? b.password : '';
    const u = validEmail(email) ? await s.authByEmail(email) : null;
    if (u?.lockUntil > Date.now()) return send(res, 429, { error: 'Too many attempts. Try again in a few minutes.' });
    if (!u || !checkPassword(password, u.passHash)) {
      if (u) {
        const fails = (u.fails || 0) + 1;
        await s.updateAuth(u._id, fails >= MAX_FAILS ? { fails: 0, lockUntil: Date.now() + LOCK_MS } : { fails });
      }
      return send(res, 401, { error: 'Email or password is not right.' });
    }
    await s.updateAuth(u._id, { fails: 0, lockUntil: 0, lastLoginAt: Date.now() });
    // this phone/browser now belongs to the account; anything it collected as a visitor is merged in
    if (vid) await s.attachDevice(vid, u._id);
    setSession(req, res, u._id);
    return send(res, 200, { user: pub(u) });
  }

  send(res, 400, { error: 'Unknown action' });
});
