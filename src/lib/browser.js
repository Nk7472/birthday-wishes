// Browser detection for the "we use Chrome" gate.
//
// For testing you can force a result with ?gate=<value> in the address bar:
//   ?gate=instagram | instagram-ios | facebook | tiktok | snapchat | safari | firefox | edge | chrome

const IN_APPS = [
  ['Instagram', /Instagram/i],
  ['Facebook', /FBAN|FBAV|FB_IAB|FBIOS/i],
  ['Messenger', /Messenger|MessengerLite/i],
  ['Snapchat', /Snapchat/i],
  ['TikTok', /TikTok|musical_ly|BytedanceWebview|Bytedance/i],
  ['LinkedIn', /LinkedInApp/i],
  ['X', /Twitter|TwitterAndroid/i],
  ['LINE', /\bLine\//i],
  ['Pinterest', /Pinterest/i],
  ['WeChat', /MicroMessenger/i],
];

const FORCED = {
  instagram: { ua: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/126.0 Mobile Safari/537.36 Instagram 330.0.0' },
  'instagram-ios': { ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21F90 Instagram 330.0.0' },
  facebook: { ua: 'Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/450.0]' },
  tiktok: { ua: 'Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36 musical_ly_33.0.0 BytedanceWebview' },
  snapchat: { ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/21F90 Snapchat/12.0' },
  safari: { ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15' },
  firefox: { ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0' },
  edge: { ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 Edg/126.0' },
  chrome: { ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36', brands: true },
};

function forcedKey() {
  try {
    return new URLSearchParams(window.location.search).get('gate');
  } catch (e) {
    return null;
  }
}

/** -> { ok, inApp: string|null, os: 'ios'|'android'|'desktop', name } */
export function detectBrowser() {
  if (typeof navigator === 'undefined') return { ok: true, inApp: null, os: 'desktop', name: 'Chrome' };
  const key = forcedKey();
  const forced = key && FORCED[key];
  const ua = forced ? forced.ua : navigator.userAgent || '';
  const brands = forced ? (forced.brands ? ['Google Chrome'] : []) : (navigator.userAgentData?.brands || []).map((b) => b.brand);

  const os = /iPhone|iPad|iPod/i.test(ua) ? 'ios' : /Android/i.test(ua) ? 'android' : 'desktop';
  const app = IN_APPS.find(([, re]) => re.test(ua));
  const webview = /; wv\)/.test(ua) && !app;
  const inApp = app ? app[0] : webview ? 'this app' : null;

  const other = /Edg\/|EdgA\/|EdgiOS\/|OPR\/|OPiOS|SamsungBrowser|Vivaldi|UCBrowser|YaBrowser|DuckDuckGo|Firefox|FxiOS|Silk\//i.test(ua);
  const chromeUA = /Chrome\/|CriOS\//.test(ua) && !other;
  const chromeBrand = brands.length === 0 || brands.includes('Google Chrome') || brands.includes('Chromium');
  const isChrome = chromeUA && chromeBrand;

  let name = 'this browser';
  if (/Firefox|FxiOS/.test(ua)) name = 'Firefox';
  else if (/Edg\/|EdgA\/|EdgiOS\//.test(ua)) name = 'Edge';
  else if (/SamsungBrowser/.test(ua)) name = 'Samsung Internet';
  else if (/OPR\/|OPiOS/.test(ua)) name = 'Opera';
  else if (/Safari\//.test(ua) && !chromeUA) name = 'Safari';

  return { ok: isChrome && !inApp, inApp, os, name };
}

/** Link that asks Chrome to open this exact page. Null when we cannot build one. */
export function chromeLink(os, url = window.location.href) {
  try {
    const u = new URL(url);
    if (os === 'android') {
      const rest = `${u.host}${u.pathname}${u.search}${u.hash}`;
      return `intent://${rest}#Intent;scheme=${u.protocol.replace(':', '')};package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(url)};end`;
    }
    if (os === 'ios') return url.replace(/^https?:/, u.protocol === 'https:' ? 'googlechromes:' : 'googlechrome:');
  } catch (e) {
    /* fall through */
  }
  return null;
}

export const CHROME_DOWNLOAD = 'https://www.google.com/chrome/';
const BYPASS = 'wishbox:continue-anyway';
export const bypassed = () => {
  try {
    return sessionStorage.getItem(BYPASS) === '1';
  } catch (e) {
    return false;
  }
};
export const setBypass = () => {
  try {
    sessionStorage.setItem(BYPASS, '1');
  } catch (e) {
    /* ignore */
  }
};
