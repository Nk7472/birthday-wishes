// Small helpers shared by every API route. Files starting with "_" are not exposed as routes on Vercel.
import crypto from 'node:crypto';

export function send(res, code, body, headers = {}) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(JSON.stringify(body));
}

/** JSON body, whether the platform parsed it (Vercel) or not (dev server, sendBeacon text/plain). */
export async function readBody(req, limit = 3_000_000) {
  let b = req.body;
  if (b === undefined || b === null) {
    const chunks = [];
    let n = 0;
    for await (const c of req) {
      n += c.length;
      if (n > limit) throw Object.assign(new Error('Request too large'), { status: 413 });
      chunks.push(c);
    }
    b = Buffer.concat(chunks).toString('utf8');
  }
  if (typeof b === 'string') {
    if (!b.trim()) return {};
    try {
      b = JSON.parse(b);
    } catch (e) {
      throw Object.assign(new Error('Bad JSON'), { status: 400 });
    }
  }
  return b && typeof b === 'object' ? b : {};
}

/** The raw bytes of the request (a photo file). */
export async function readRaw(req, limit = 2_000_000) {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (req.body instanceof Uint8Array) return Buffer.from(req.body);
  const chunks = [];
  let n = 0;
  for await (const c of req) {
    n += c.length;
    if (n > limit) throw Object.assign(new Error('File too large'), { status: 413 });
    chunks.push(c);
  }
  return Buffer.concat(chunks);
}

export function sendBinary(res, code, buf, type, headers = {}) {
  res.statusCode = code;
  res.setHeader('Content-Type', type);
  res.setHeader('Content-Length', buf.length);
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(buf);
}

/** Android / iOS / desktop from the User-Agent (the browser also sends its own, richer answer). */
export function platformOf(ua = '') {
  const ios = /iPhone|iPad|iPod/.test(ua);
  const android = /Android/.test(ua);
  const os = ios ? 'ios' : android ? 'android' : /Windows/.test(ua) ? 'windows' : /Mac OS X|Macintosh/.test(ua) ? 'macos' : /CrOS/.test(ua) ? 'chromeos' : /Linux/.test(ua) ? 'linux' : 'other';
  const device = /iPad/.test(ua) ? 'tablet' : ios ? 'phone' : android ? (/Mobile/.test(ua) ? 'phone' : 'tablet') : 'desktop';
  const browser = /CriOS|Chrome\//.test(ua) ? 'chrome' : /Safari\//.test(ua) ? 'safari' : /Firefox|FxiOS/.test(ua) ? 'firefox' : 'other';
  return { os, device, browser };
}

export const str = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
export const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** Keep event/extra props small and flat: strings, numbers, booleans only. */
export function cleanProps(p) {
  const out = {};
  if (!p || typeof p !== 'object' || Array.isArray(p)) return out;
  for (const [k, v] of Object.entries(p).slice(0, 14)) {
    const key = String(k).slice(0, 30);
    if (typeof v === 'string') out[key] = v.slice(0, 160);
    else if (typeof v === 'number' && Number.isFinite(v)) out[key] = v;
    else if (typeof v === 'boolean') out[key] = v;
  }
  return out;
}

// ---------- sessions: a signed cookie, no extra dependency ----------
const COOKIE = 'wb_session';
const MAX_AGE = 60 * 60 * 24 * 30;

function secret() {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  if (!globalThis.__wbSecret) {
    globalThis.__wbSecret = crypto.randomBytes(32).toString('hex');
    console.warn('[wishbox] AUTH_SECRET is not set: using a temporary secret, so logins reset whenever the server restarts.');
  }
  return globalThis.__wbSecret;
}
const sign = (b) => crypto.createHmac('sha256', secret()).update(b).digest('base64url');

/** Any small JSON object, signed so the browser cannot change it. `e` (expiry, ms since epoch) is checked on read. */
export function signPayload(obj) {
  const body = Buffer.from(JSON.stringify(obj)).toString('base64url');
  return `${body}.${sign(body)}`;
}
export function readPayload(t) {
  const [body, sig] = String(t || '').split('.');
  if (!body || !sig) return null;
  const want = Buffer.from(sign(body));
  const got = Buffer.from(sig);
  if (want.length !== got.length || !crypto.timingSafeEqual(want, got)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return p && typeof p === 'object' && (!p.e || p.e > Date.now()) ? p : null;
  } catch (e) {
    return null;
  }
}
export const hmac = (s) => sign(String(s));

export const makeToken = (uid) => signPayload({ u: uid, e: Date.now() + MAX_AGE * 1000 });
export function readToken(t) {
  const p = readPayload(t);
  return p && typeof p.u === 'string' && p.e ? p.u : null;
}
const parseCookies = (req) =>
  Object.fromEntries(String(req.headers.cookie || '').split(';').map((c) => c.trim().split(/=(.*)/s).slice(0, 2)).filter((x) => x[0]));

export const sessionUid = (req) => readToken(parseCookies(req)[COOKIE]);

const secure = (req) => (req.headers['x-forwarded-proto'] || '').split(',')[0] === 'https';
export function setSession(req, res, uid) {
  const flags = `Path=/; HttpOnly; SameSite=Lax; Max-Age=${uid ? MAX_AGE : 0}${secure(req) ? '; Secure' : ''}`;
  res.setHeader('Set-Cookie', `${COOKIE}=${uid ? makeToken(uid) : ''}; ${flags}`);
}

// ---------- passwords: scrypt (built into Node) ----------
export function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(pw, salt, 64);
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}
export function checkPassword(pw, stored) {
  const [alg, s, h] = String(stored || '').split('$');
  if (alg !== 'scrypt' || !s || !h) return false;
  const want = Buffer.from(h, 'base64');
  const got = crypto.scryptSync(pw, Buffer.from(s, 'base64'), want.length);
  return crypto.timingSafeEqual(want, got);
}

export const newId = () => crypto.randomBytes(12).toString('hex');
export const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

/** Turn a database/driver error into a plain-English cause + fix (no secrets in it). */
export function explainDbError(e) {
  const m = String(e?.message || e || '');
  const c = String(e?.code || '');
  if (/Cannot find (package|module) 'mongodb'|ERR_MODULE_NOT_FOUND/.test(m)) return 'The mongodb package is not installed. Run: npm install';
  if (/<password>|<db_password>|<db_username>/.test(m) || /Invalid scheme|Invalid connection string|must be a string/.test(m)) return 'MONGODB_URI is not valid. Put your real password in place of <password> (and use your real username), with no angle brackets.';
  if (/bad auth|Authentication failed|AuthenticationFailed|auth failed/i.test(m) || e?.code === 18) return 'Atlas rejected the username or password. Check them in Atlas > Database Access (reset the password if unsure). If the password has symbols like @ : / # ? it must be URL-encoded.';
  if (/querySrv|ENOTFOUND|ECONNREFUSED.*srv|EAI_AGAIN|getaddrinfo/i.test(m) || /^(ENOTFOUND|EAI_AGAIN)$/.test(c)) return 'Your network could not look up the Atlas address (DNS). Fix: set MONGODB_DNS=8.8.8.8,1.1.1.1 in .env.local and restart, or switch your computer/Wi-Fi DNS to 8.8.8.8, or try a mobile hotspot.';
  if (/Server selection timed out|ReplicaSetNoPrimary|connection .* timed out|ETIMEDOUT|ssl3_read_bytes|tlsv1 alert|MongoNetworkError|MongoServerSelectionError/i.test(m)) return 'Could not reach Atlas. Most often your IP is not allowed: Atlas > Network Access > Add IP Address > "Allow access from anywhere" (0.0.0.0/0), wait a minute, restart. Also check the cluster is not paused.';
  if (/not authorized|requires authentication|Unauthorized/i.test(m)) return 'This database user is not allowed to write. In Atlas > Database Access give it "Read and write to any database".';
  return m ? `Database error: ${m.slice(0, 200)}` : 'Unknown database error.';
}

/** Wrap a route: method check, error → JSON, never leak internals. */
export function route(methods, fn) {
  return async (req, res) => {
    try {
      if (!methods.includes(req.method)) return send(res, 405, { error: 'Method not allowed' });
      await fn(req, res);
    } catch (e) {
      const status = e.status || 500;
      const hint = status >= 500 ? explainDbError(e) : undefined;
      if (status >= 500) console.error(`[wishbox api] ${req.url} failed. ${hint}\n`, e);
      // the plain-English cause is shown outside production so it is visible in the browser's Network tab
      const showHint = hint && process.env.VERCEL_ENV !== 'production';
      send(res, status, { error: status >= 500 ? 'Something went wrong on our side. Please try again.' : e.message, ...(showHint ? { hint } : {}) });
    }
  };
}

export const geoOf = (req) => {
  const h = req.headers;
  const d = (k) => (h[k] ? decodeURIComponent(String(h[k])).slice(0, 60) : undefined);
  return { country: d('x-vercel-ip-country'), region: d('x-vercel-ip-country-region'), city: d('x-vercel-ip-city') };
};

/** Best guess of the caller's address (only used to rate-limit the captcha). */
export const ipOf = (req) => String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim().slice(0, 60);
