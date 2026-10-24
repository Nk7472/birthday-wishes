// Which kind of device is this? (Android / iOS / desktop ...). Sent with the visitor's first request.
export function detectPlatform() {
  const ua = navigator.userAgent || '';
  const touchMac = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1; // iPadOS pretends to be a Mac
  const ios = /iPhone|iPad|iPod/.test(ua) || touchMac;
  const android = /Android/.test(ua);
  const os = ios ? 'ios' : android ? 'android' : /Windows/.test(ua) ? 'windows' : /Macintosh|Mac OS X/.test(ua) ? 'macos' : /CrOS/.test(ua) ? 'chromeos' : /Linux/.test(ua) ? 'linux' : 'other';
  const device = /iPad/.test(ua) || (touchMac && !/iPhone/.test(ua)) ? 'tablet' : ios ? 'phone' : android ? (/Mobile/.test(ua) ? 'phone' : 'tablet') : 'desktop';
  const v = ios ? /OS (\d+)[_.](\d+)/.exec(ua) : android ? /Android (\d+(?:\.\d+)?)/.exec(ua) : null;
  const osVersion = v ? (ios ? `${v[1]}.${v[2]}` : v[1]) : '';
  const browser = /CriOS|Chrome\//.test(ua) ? 'chrome' : /FxiOS|Firefox/.test(ua) ? 'firefox' : /Safari\//.test(ua) ? 'safari' : 'other';
  return { os, osVersion, device, browser, model: '' };
}

/** Android's Chrome can also tell us the phone model (iPhones never do). Resolves quickly either way. */
export async function detectPlatformFull() {
  const p = detectPlatform();
  try {
    const hi = await Promise.race([
      navigator.userAgentData?.getHighEntropyValues?.(['model', 'platformVersion']),
      new Promise((r) => setTimeout(r, 400)),
    ]);
    if (hi?.model) p.model = hi.model;
    if (hi?.platformVersion && p.os === 'android') p.osVersion = hi.platformVersion.split('.')[0];
  } catch (e) {
    /* not available */
  }
  return p;
}

export const isIOS = () => detectPlatform().os === 'ios';
export const isAndroid = () => detectPlatform().os === 'android';
