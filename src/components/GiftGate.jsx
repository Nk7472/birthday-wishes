import { useState } from 'react';
import { sfx, unlockAudio } from '../lib/audio';
import { confetti } from '../lib/confetti';
import Stage from './shared/Stage';

/**
 * The "tap to open" screen. It exists because browsers only allow sound after
 * a tap — and it makes the wish feel like a real gift being unwrapped.
 * Deliberately quiet: white paper, one blue ribbon, one big line of type.
 */
export default function GiftGate({ wish, onOpen }) {
  const [opening, setOpening] = useState(false);

  const open = () => {
    if (opening) return;
    unlockAudio(); // must happen inside the tap
    setOpening(true);
    sfx.tada();
    confetti.burst({ x: 0.5, y: 0.46, count: 56, spread: 360, power: 0.9, gravity: 0.8 });
    setTimeout(onOpen, 800);
  };

  return (
    <Stage className="flex flex-col items-center justify-center bg-canvas text-center text-ink">
      <button
        type="button"
        onClick={open}
        data-gate-open
        className="absolute inset-0 z-10 cursor-pointer focus:outline-none"
        aria-label={`Open your ${wish.kind === 'thanks' ? 'thank you' : wish.kind === 'love' ? 'love note' : 'birthday gift'}, ${wish.name}`}
      />

      <p className="ui-in relative z-0 mb-[6cqmin] px-6 text-[clamp(0.95rem,3.8cqmin,1.3rem)] font-medium text-mute">
        {wish.hasFrom ? `${wish.from} made something for you` : 'Someone made something for you'}
      </p>

      <div
        className="relative z-0 w-[46cqmin] max-w-[260px]"
        style={{ animation: opening ? 'none' : 'giftBob 3.2s ease-in-out infinite' }}
      >
        <svg viewBox="0 0 200 210" className="w-full overflow-visible" aria-hidden="true">
          <ellipse cx="100" cy="204" rx="70" ry="6" fill="#1d1d1f" opacity="0.08" />
          <rect x="26" y="96" width="148" height="108" rx="14" fill="#1d1d1f" opacity="0.07" />
          <rect x="26" y="90" width="148" height="108" rx="14" fill="#fff" stroke="#1d1d1f" strokeOpacity="0.1" />
          <rect x="92" y="90" width="16" height="108" fill="#0071e3" />
          <g
            style={{
              transformBox: 'fill-box',
              transformOrigin: '50% 100%',
              transition: 'transform 0.8s var(--ease-spring), opacity 0.6s var(--ease-out)',
              transform: opening ? 'translateY(-64px) rotate(-14deg)' : 'none',
              opacity: opening ? 0 : 1,
            }}
          >
            <rect x="16" y="64" width="168" height="38" rx="12" fill="#fff" stroke="#1d1d1f" strokeOpacity="0.1" />
            <rect x="92" y="64" width="16" height="38" fill="#0071e3" />
            <path d="M100 64 C 72 26, 40 42, 64 64 Z" fill="#0071e3" />
            <path d="M100 64 C 128 26, 160 42, 136 64 Z" fill="#0071e3" opacity="0.8" />
          </g>
        </svg>
      </div>

      <h1 className="ui-in relative z-0 mt-[6cqmin] px-6 text-[clamp(2.1rem,10cqmin,3.6rem)] font-semibold leading-[1.02] tracking-[-0.03em] [animation-delay:120ms]">
        For {wish.name}
      </h1>
      <p className="ui-in relative z-0 mt-[3.4cqmin] text-[clamp(0.95rem,3.8cqmin,1.2rem)] font-medium text-accent [animation-delay:220ms]">
        {opening ? 'Here we go…' : 'Tap to open'}
      </p>
    </Stage>
  );
}
