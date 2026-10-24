// Chrome fullscreen helpers. Must be called from inside a tap.
export const isFullscreen = () => !!document.fullscreenElement;

export function enterFullscreen() {
  const el = document.documentElement;
  try {
    const p = el.requestFullscreen?.({ navigationUI: 'hide' });
    if (p && p.catch) p.catch(() => {});
    return true;
  } catch (e) {
    return false;
  }
}

export function leaveFullscreen() {
  try {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  } catch (e) {
    /* ignore */
  }
}
