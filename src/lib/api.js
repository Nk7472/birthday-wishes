// Talking to our own backend (/api/*, served by Vercel functions or the Vite dev server).
const VKEY = 'wishbox:vid:v1';

const randomId = () => {
  try {
    if (crypto.randomUUID) return crypto.randomUUID();
  } catch (e) {
    /* insecure context */
  }
  const a = new Uint8Array(16);
  (crypto.getRandomValues ? crypto.getRandomValues(a) : a.forEach((_, i) => (a[i] = Math.random() * 256)));
  return [...a].map((x) => x.toString(16).padStart(2, '0')).join('');
};
export const newId = randomId;

let vid = '';
let returning = false;
/** The visitor's temporary id: made the first time the site loads and kept on this device. */
export function getVid() {
  if (vid) return vid;
  try {
    vid = localStorage.getItem(VKEY) || '';
    returning = !!vid;
  } catch (e) {
    /* private mode */
  }
  if (!vid) {
    vid = randomId();
    try {
      localStorage.setItem(VKEY, vid);
    } catch (e) {
      /* kept in memory for this visit */
    }
  }
  return vid;
}
export const isReturning = () => (getVid(), returning);

const UKEY = 'wishbox:uid:v1';
let uid = '';
/** The person's folder id in our database ("user12_k3f9a2"), told to us by the server. '' until the first reply. */
export function getUid() {
  if (!uid) {
    try {
      uid = localStorage.getItem(UKEY) || '';
    } catch (e) {
      /* private mode */
    }
  }
  return uid;
}
export function setUid(next) {
  if (!next || next === uid) return;
  uid = next;
  try {
    localStorage.setItem(UKEY, uid);
  } catch (e) {
    /* kept in memory */
  }
}
/** After logging out this browser becomes a brand-new visitor with a new folder. */
export function resetVisitor() {
  vid = '';
  uid = '';
  returning = false;
  try {
    localStorage.removeItem(VKEY);
    localStorage.removeItem(UKEY);
  } catch (e) {
    /* ignore */
  }
  getVid();
}

export class ApiError extends Error {
  constructor(message, status = 0, code = '') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function call(path, init) {
  let res;
  try {
    res = await fetch(`/api/${path}`, { credentials: 'same-origin', ...init });
  } catch (e) {
    throw new ApiError('Could not reach the server. Check your connection and try again.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || 'Something went wrong. Please try again.', res.status, data.code);
  if (data.uid) setUid(data.uid);
  return data;
}
export const apiPost = (path, body, extra = {}) =>
  call(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vid: getVid(), ...body }), ...extra });
export const apiGet = (path) => call(path, { method: 'GET' });
