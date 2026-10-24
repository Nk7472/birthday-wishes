import { useEffect, useRef } from 'react';
import LocationGuide from '../components/LocationGuide';
import TeddyAsk from '../components/TeddyAsk';
import { detectPlatform } from '../lib/platform';

const Spinner = () => <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />;

/**
 * Slides up from the bottom when the preview cannot start yet. reason:
 *   'denied'  "Don't allow" was tapped      teddy asks again, button asks again
 *   'blocked' remembered "Never allow"      animated guide: where to tap in Chrome / iPhone Settings
 *   'off'     phone location is switched off animated guide: how to turn it on (we also retry by ourselves)
 *   'ready'   location saved                one tap to go full screen and start (browsers need a fresh tap for that)
 */
export default function LocationDrawer({ reason, busy, onAllow, onStart, onClose }) {
  const os = detectPlatform().os;
  const kind = os === 'ios' ? 'ios' : os === 'android' ? 'android' : 'desktop';
  const again = useRef(onAllow);
  again.current = onAllow;

  useEffect(() => {
    const key = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose]);

  // After the person fixes the setting and comes back (or Chrome's permission changes) try again by ourselves.
  useEffect(() => {
    if (reason !== 'blocked' && reason !== 'off') return undefined;
    let t = 0;
    const retry = () => {
      if (document.visibilityState !== 'visible') return;
      clearTimeout(t);
      t = setTimeout(() => again.current(), 700);
    };
    document.addEventListener('visibilitychange', retry);
    let status;
    navigator.permissions?.query({ name: 'geolocation' }).then((s) => {
      status = s;
      s.onchange = retry;
    }).catch(() => {});
    return () => {
      clearTimeout(t);
      document.removeEventListener('visibilitychange', retry);
      if (status) status.onchange = null;
    };
  }, [reason]);

  const guide = reason === 'blocked' || reason === 'off';
  const title = {
    denied: 'We need your location',
    blocked: 'Location is blocked for this site',
    off: 'Please turn on your location',
    ready: 'Preview is Ready!',
  }[reason];
  const body = {
    denied: 'It is important for the new features we are adding soon, so please let us use it. You can change your mind anytime.',
    blocked: kind === 'ios' ? 'Chrome remembers you said “never”. Follow these steps once and we continue automatically.' : 'Chrome remembers you said “never”. Follow these steps once and we continue automatically.',
    off: 'Your phone’s location switch looks off. Turn it on and we continue automatically.',
    ready: 'Tap start and your preview begins in full screen.',
  }[reason];

  return (
    <div className="ui-fade absolute inset-0 z-[120] flex items-end bg-black/45" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="ui-sheet max-h-full w-full overflow-y-auto rounded-t-[1.9rem] bg-surface px-5 pb-[max(1.4rem,env(safe-area-inset-bottom))] pt-2.5 shadow-[var(--shadow-lift)]"
      >
        <div className="mx-auto h-[5px] w-9 rounded-full bg-black/15" />

        <div className="mt-4 flex items-center gap-3">
          <TeddyAsk face={reason === 'ready' ? 'happy' : 'open'} className={guide ? 'w-[4.8rem] shrink-0' : 'w-[7.4rem] shrink-0'} />
          <div className="min-w-0 flex-1">
            <h2 className="text-[1.25rem] font-bold leading-tight tracking-[-0.025em]">{title}</h2>
            <p className="mt-1.5 text-[0.9rem] leading-snug text-mute">{body}</p>
            {!guide ? (
              reason === 'ready' ? (
                <button type="button" onClick={onStart} className="btn btn-primary mt-3 w-full !py-[0.85rem]">Start preview</button>
              ) : (
                <button type="button" disabled={busy} onClick={onAllow} className="btn btn-primary mt-3 w-full !py-[0.85rem]">
                  {busy ? <Spinner /> : 'Continue with location'}
                </button>
              )
            ) : null}
          </div>
        </div>

        {guide ? (
          <>
            <div className="mt-4">
              <LocationGuide kind={reason} os={kind} />
            </div>
            <button type="button" disabled={busy} onClick={onAllow} className="btn btn-primary mt-3 w-full !py-[0.9rem]">
              {busy ? <Spinner /> : reason === 'off' ? 'I turned it on, continue' : 'I allowed it, continue'}
            </button>
          </>
        ) : null}

        <button type="button" onClick={onClose} className="mt-2 w-full py-2.5 text-[0.9rem] font-semibold text-mute active:opacity-60">
          Not now
        </button>
      </div>
    </div>
  );
}
