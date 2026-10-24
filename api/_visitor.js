// Who is calling? Every request names its browser (vid); the server maps it to the person's folder id (uid).
import { geoOf, num, platformOf, sessionUid, str } from './_util.js';

/**
 * Returns { uid, fresh }. `fresh` is true on the very first request of a brand-new browser.
 * If the request carries a login cookie for a different account than this browser was filed under, the browser is
 * moved to that account (what it collected as a plain visitor is merged into it).
 */
export async function identify(req, s, vid) {
  let r = await s.resolveUid(vid);
  const sid = sessionUid(req);
  if (sid && sid !== r.uid) {
    await s.attachDevice(vid, sid);
    r = { uid: sid, fresh: false };
  }
  return r;
}

/** Registers / refreshes this browser's device row and the person's "last seen" (writes only, no reads). */
export async function touchDevice(s, req, { uid, fresh }, vid, info = {}) {
  const now = Date.now();
  const geo = geoOf(req);
  const ua = str(req.headers['user-agent'], 300);
  const fromUA = platformOf(ua);
  const platform = {
    os: ['ios', 'android', 'windows', 'macos', 'linux', 'chromeos', 'other'].includes(info.os) ? info.os : fromUA.os,
    osVersion: str(info.osVersion, 20),
    device: ['phone', 'tablet', 'desktop'].includes(info.device) ? info.device : fromUA.device,
    model: str(info.model, 60),
    browser: str(info.browser, 20) || fromUA.browser,
  };
  const set = {
    lastSeen: now,
    ua,
    platform,
    os: platform.os,
    lang: str(info.lang, 20),
    tz: str(info.tz, 60),
    screen: [num(info.sw), num(info.sh)],
    standalone: !!info.standalone,
    lastGeo: geo,
  };
  const first = fresh ? { firstSeen: now, referrer: str(info.ref, 300), landing: str(info.landing, 200), firstGeo: geo } : null;
  await s.touchDevice(uid, vid, set, first, { visits: 1 });
}
