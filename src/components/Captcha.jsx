import { useEffect, useRef, useState } from 'react';
import { track } from '../lib/track';

/** The blue "verified" seal (also used as the big "Verified by Wishbox" badge). */
export const Seal = ({ className = 'h-6 w-6' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      d="M12 1.6l2.5 1.7 3-.3 1.4 2.7 2.7 1.4-.3 3L22.9 12l-1.6 2.4.3 3-2.7 1.4-1.4 2.7-3-.3L12 22.9l-2.5-1.7-3 .3-1.4-2.7-2.7-1.4.3-3L1.1 12l1.6-2.4-.3-3 2.7-1.4 1.4-2.7 3 .3z"
      fill="#0071e3"
    />
    <path d="M7.6 12.4l3 3 5.9-6.3" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Shield = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
    <path d="M12 2.5l8 3v6.2c0 4.6-3.2 8.3-8 9.8-4.8-1.5-8-5.2-8-9.8V5.5z" fill="#0071e3" opacity=".12" stroke="#0071e3" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M8.6 12.2l2.4 2.4 4.4-4.8" fill="none" stroke="#0071e3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * "I'm not a robot": a DUMMY for now. Tap the box, it spins for a second and then says verified. Nothing is checked
 * anywhere (no server call). To make it real later, swap this component for Cloudflare Turnstile / reCAPTCHA and
 * check the token in api/auth.js before creating the account.
 */
export default function Captcha({ passed, onPass }) {
  const [loading, setLoading] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);

  const start = () => {
    if (passed || loading) return;
    setLoading(true);
    track('captcha_start');
    timer.current = setTimeout(() => {
      setLoading(false);
      track('captcha_passed');
      onPass('demo');
    }, 1000);
  };

  return (
    <div>
      <div className={`flex items-center gap-3.5 rounded-2xl border bg-white px-4 py-[0.95rem] shadow-sm transition-colors ${passed ? 'border-[#34c759]/50' : 'border-black/15'}`}>
        <button
          type="button"
          role="checkbox"
          aria-checked={passed}
          aria-label="I'm not a robot"
          onClick={start}
          disabled={passed}
          className={`relative grid h-[1.9rem] w-[1.9rem] shrink-0 place-items-center rounded-lg border-2 transition-all duration-300 active:scale-90 ${passed ? 'border-[#34c759] bg-[#34c759]' : 'border-black/30 bg-white'}`}
        >
          {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent/30 border-t-accent" /> : null}
          {passed ? (
            <svg viewBox="0 0 24 24" className="ui-pop h-5 w-5" aria-hidden="true">
              <path d="M5.5 12.5l4.4 4.4 8.6-9.4" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : null}
        </button>
        <span className="text-[1.05rem] font-medium">I’m not a robot</span>
        <span className="ml-auto flex flex-col items-center text-[0.6rem] font-semibold leading-none text-mute">
          <Shield />
          <span className="mt-0.5">Instagram</span>
        </span>
      </div>
    </div>
  );
}
