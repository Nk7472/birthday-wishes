// Accounts live in our database (MongoDB) and are checked by the server (/api/auth). The browser keeps only a
// signed, httpOnly cookie; the copy of the profile below is just so the UI can draw instantly.
import { useSyncExternalStore } from 'react';
import { ApiError, apiGet, apiPost, resetVisitor } from './api';
import { newVisit } from './track';
export { COUNTRIES, cleanPhone, validEmail } from '../../shared/validate.js';

const CACHE = 'wishbox:user:v1';

const read = () => {
  try {
    return JSON.parse(localStorage.getItem(CACHE));
  } catch (e) {
    return null;
  }
};
let user = read();
const subs = new Set();
const setUser = (u) => {
  user = u;
  try {
    if (u) localStorage.setItem(CACHE, JSON.stringify(u));
    else localStorage.removeItem(CACHE);
  } catch (e) {
    /* ignore */
  }
  subs.forEach((f) => f());
};
const subscribe = (f) => {
  subs.add(f);
  return () => subs.delete(f);
};

export const useAuth = () => useSyncExternalStore(subscribe, () => user, () => null);
export class AuthError extends Error {
  constructor(message, code = '') {
    super(message);
    this.code = code;
  }
}

const wrap = async (fn) => {
  try {
    return await fn();
  } catch (e) {
    throw new AuthError(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.', e instanceof ApiError ? e.code : '');
  }
};

/** Ask the server who is logged in (the cookie decides). Called once when the app opens. */
export async function refreshUser() {
  try {
    const { user: u } = await apiGet('auth');
    setUser(u || null);
  } catch (e) {
    /* offline: keep what we have */
  }
}

export const signUp = (f) =>
  wrap(async () => {
    const { user: u } = await apiPost('auth', { action: 'signup', name: f.name, email: f.email, phone: f.phone, dial: f.dial, password: f.password, captcha: f.captcha });
    setUser(u);
    return u;
  });

export const signIn = (f) =>
  wrap(async () => {
    const { user: u } = await apiPost('auth', { action: 'login', email: f.email, password: f.password });
    setUser(u);
    return u;
  });

export function signOut() {
  setUser(null);
  // the cookie is cleared by the server; then this browser starts over as a new visitor (its own new folder id)
  apiPost('auth', { action: 'logout' }).catch(() => {}).finally(() => {
    resetVisitor();
    newVisit();
  });
}
