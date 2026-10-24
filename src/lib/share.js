// A wish is stored entirely inside the link (no backend needed).
// To use a database instead, replace saveWish/loadWish with API calls.

const DEFAULT_MESSAGE =
  'Wishing you a day filled with laughter, cake and everything you love. Happy Birthday!';
const LOVE_MESSAGE = 'Every day with you feels like my favourite one. I love you, today and always.';
const LOVE_WISHES = ['The way you laugh at my worst jokes', 'How safe I feel next to you', 'Every little thing you do'];
const THANKS_MESSAGE = 'Thank you so much. It truly meant the world to me, and it made my day.';
const THANKS_WISHES = ['You always make time for me', 'Your kindness is contagious', 'I am so lucky to have you'];
export const kindOf = (templateId = '') => {
  const id = String(templateId);
  return id.startsWith('love-') ? 'love' : id.startsWith('thanks-') ? 'thanks' : 'birthday';
};
const DEFAULT_WISHES = [
  'Your smile makes every room brighter',
  'You turn ordinary days into adventures',
  'The world is better with you in it',
];

const clean = (s, max) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

export function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Turn raw form data into display-safe values. Templates always receive this
 * shape (via useWish()), so they never have to handle empty fields.
 *
 * @param raw     { template, name, age, from, message, reason, wishes[], photo, frame }
 * @param sample  when true, empty fields fall back to demo data (studio preview)
 */
export function normalizeWish(raw = {}, { sample = false } = {}) {
  const name = clean(raw.name, 28) || (sample ? 'Aisha' : 'Friend');
  const ageNum = parseInt(raw.age, 10);
  const age = Number.isFinite(ageNum) && ageNum > 0 && ageNum < 121 ? ageNum : sample && !raw.name ? 24 : null;
  const from = clean(raw.from, 28) || (sample ? 'Rahul' : '');
  const kind = kindOf(raw.template);
  const message = String(raw.message ?? '').trim().slice(0, 280) || (kind === 'love' ? LOVE_MESSAGE : kind === 'thanks' ? THANKS_MESSAGE : DEFAULT_MESSAGE);
  const given = (raw.wishes || []).map((w) => clean(w, 60)).filter(Boolean);
  const wishes = [...given, ...(kind === 'love' ? LOVE_WISHES : kind === 'thanks' ? THANKS_WISHES : DEFAULT_WISHES)].slice(0, 3);
  // what the thanks is for, e.g. "your birthday wishes" (scenes read: Thank you for {thanksFor})
  const reason = clean(raw.reason, 40) || (sample && kind === 'thanks' ? 'your lovely birthday wishes' : '');
  const photo = typeof raw.photo === 'string' && raw.photo.startsWith('data:image') ? raw.photo : '';
  return {
    template: raw.template || '',
    kind,
    frame: raw.frame === 'square' ? 'square' : 'circle',
    name,
    initials: name.slice(0, 1).toUpperCase(),
    age,
    ageText: age ? String(age) : '',
    ordinal: age ? ordinal(age) : '',
    from,
    hasFrom: !!from,
    message,
    reason,
    thanksFor: reason || 'everything',
    wishes,
    photo,
    hasPhoto: !!photo,
  };
}

// --- tiny URL-safe codec (no dependencies) ---------------------------------
const toB64Url = (b64) => b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64Url = (s) => {
  const b = s.replace(/-/g, '+').replace(/_/g, '/');
  return b + '='.repeat((4 - (b.length % 4)) % 4);
};
const utf8ToB64 = (str) => {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
};
const b64ToUtf8 = (b64) => {
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};
const JPEG_PREFIX = 'data:image/jpeg;base64,';

/** raw wish -> short URL-safe code. Photo is appended after a "~". */
export function encodeWish(raw) {
  const payload = {
    t: raw.template,
    n: clean(raw.name, 28),
    a: raw.age ? parseInt(raw.age, 10) || 0 : 0,
    f: clean(raw.from, 28),
    m: String(raw.message ?? '').trim().slice(0, 280),
    w: (raw.wishes || []).map((w) => clean(w, 60)).filter(Boolean).slice(0, 3),
    s: raw.frame === 'square' ? 1 : 0,
    r: clean(raw.reason, 40),
  };
  const head = toB64Url(utf8ToB64(JSON.stringify(payload)));
  const photo = raw.photo && raw.photo.startsWith(JPEG_PREFIX) ? toB64Url(raw.photo.slice(JPEG_PREFIX.length)) : '';
  return photo ? `${head}~${photo}` : head;
}

export function decodeWish(code) {
  try {
    const [head, photo = ''] = String(code).split('~');
    const p = JSON.parse(b64ToUtf8(fromB64Url(head)));
    if (!p || typeof p !== 'object') return null;
    return {
      template: p.t || '',
      name: p.n || '',
      age: p.a || '',
      from: p.f || '',
      message: p.m || '',
      wishes: Array.isArray(p.w) ? p.w : [],
      reason: p.r || '',
      frame: p.s ? 'square' : 'circle',
      photo: photo ? JPEG_PREFIX + fromB64Url(photo) : '',
    };
  } catch (e) {
    return null;
  }
}

export function buildLink(raw) {
  const base = typeof window !== 'undefined' ? window.location.href.split('#')[0] : '';
  return `${base}#/w/${encodeWish(raw)}`;
}

export function parseHash(hash) {
  const m = /^#\/w\/(.+)$/.exec(hash || '');
  return m ? m[1] : null;
}
