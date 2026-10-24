import { useEffect, useState } from 'react';
import { sfx } from '../lib/audio';

/**
 * Film-leader countdown (3, 2, 1) with a sweeping clock hand.
 */
export default function Countdown({ title, onDone }) {
  const [n, setN] = useState(3);

  useEffect(() => {
    sfx.tick();
    const id = setInterval(() => {
      setN((v) => {
        if (v <= 1) {
          clearInterval(id);
          setTimeout(onDone, 120);
          return 0;
        }
        sfx.tick();
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#121212] text-white" style={{ containerType: 'size' }} aria-live="assertive">
      <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 50%, #2a2a2c 0%, #121212 70%)' }} />

      {/* cross-hair */}
      <span className="absolute left-0 right-0 top-1/2 h-px bg-white/25" />
      <span className="absolute bottom-0 top-0 left-1/2 w-px bg-white/25" />
      <div className="absolute left-1/2 top-1/2 aspect-square w-[78cqmin] -translate-x-1/2 -translate-y-1/2 rounded-full border-[0.7cqmin] border-white/70" />
      <div className="absolute left-1/2 top-1/2 aspect-square w-[60cqmin] -translate-x-1/2 -translate-y-1/2 rounded-full border-[0.35cqmin] border-white/35" />

      {/* sweeping hand: one lap per second, transform-only */}
      <div className="absolute left-1/2 top-1/2 aspect-square w-[78cqmin] -translate-x-1/2 -translate-y-1/2">
        <div
          key={n}
          className="leader-sweep h-full w-full rounded-full"
          style={{ background: 'conic-gradient(from 0deg, rgb(255 255 255 / 0) 0deg, rgb(255 255 255 / 0.22) 358deg, rgb(255 255 255 / 0.55) 360deg)' }}
        />
      </div>

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {n > 0 ? (
          <span key={n} className="leader-num block text-[46cqmin] font-extrabold leading-none tabular-nums tracking-[-0.04em]">
            {n}
          </span>
        ) : null}
      </div>

      <div className="absolute inset-x-0 bottom-[7cqmin] flex items-center justify-between px-[8cqmin] text-[3cqmin] font-semibold uppercase tracking-[0.22em] text-white/55">
        <span>Take 1</span>
        <span className="max-w-[55%] truncate">{title}</span>
      </div>
    </div>
  );
}
