import { createContext, useContext } from 'react';

const WishCtx = createContext(null);

/** Provides the normalized wish (see normalizeWish in lib/share.js). */
export function WishProvider({ wish, children }) {
  return <WishCtx.Provider value={wish}>{children}</WishCtx.Provider>;
}

/**
 * Templates call this to read the friend's details:
 * { name, initials, age, ageText, ordinal, from, hasFrom, message,
 *   wishes: [3 strings], photo, hasPhoto }
 */
export function useWish() {
  const w = useContext(WishCtx);
  if (!w) throw new Error('useWish must be used inside <WishProvider>');
  return w;
}
