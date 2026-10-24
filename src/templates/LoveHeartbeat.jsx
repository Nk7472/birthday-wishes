import { useEffect, useState } from 'react';
import Avatar from '../components/shared/Avatar';
import Board from '../components/shared/Board';
import Drift from '../components/shared/Drift';
import { useTimeline } from '../components/shared/hooks';
import Reveal from '../components/shared/Reveal';
import SplitText from '../components/shared/SplitText';
import Stage from '../components/shared/Stage';
import Typewriter from '../components/shared/Typewriter';
import { useWish } from '../components/shared/WishContext';
import { sfx } from '../lib/audio';
import { confetti } from '../lib/confetti';
import { fitName } from '../lib/fit';
import { msgSize, togetherText } from '../lib/love';

const BEAT = 'M0 30 H22 L28 30 L34 16 L41 46 L49 4 L57 34 L62 30 H100';
const HEART = 'M50 90 C 12 62, 2 40, 2 27 C 2 11, 14 3, 28 3 C 38 3, 46 9, 50 17 C 54 9, 62 3, 72 3 C 86 3, 98 11, 98 27 C 98 40, 88 62, 50 90 Z';

export default function LoveHeartbeat() {
  const w = useWish();
  const step = useTimeline([400, 3000, 7200, 10800]);
  const [bursts, setBursts] = useState(0);
  const together = togetherText(w);

  useEffect(() => {
    if (step === 2) sfx.sparkle();
    if (step === 3) sfx.chime(784);
  }, [step]);

  const burst = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    confetti.burst({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height, count: 14, spread: 360, power: 0.5, gravity: 0.15, emojis: ['❤️', '💖', '💕'], size: 1.4, ttl: 2.6 });
    sfx.pop();
    setBursts((b) => b + 1);
  };

  return (
    <Stage className="bg-[#1c0612] text-white">
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 38%, #5a1233 0%, #2b0a1c 48%, #14040c 100%)' }} />
      <Drift count={16} seed={7} anim="rise" size={[10, 22]} duration={[12, 22]} delay={[0, 18]} sway colors={['#ff6b9a', '#ff9fbd', '#ffd1df']}>
        {(p) => <span className="block text-center leading-none" style={{ fontSize: p.size, opacity: 0.6, color: p.color }}>♥</span>}
      </Drift>

      <Board className="pointer-events-none">
        {/* heartbeat monitor line */}
        <div className="absolute inset-x-0 top-[7%] h-[12cqw] overflow-hidden" style={{ maskImage: 'linear-gradient(90deg, transparent, #000 18%, #000 82%, transparent)', WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 18%, #000 82%, transparent)' }}>
          <svg viewBox="0 0 400 60" preserveAspectRatio="none" className="absolute left-0 top-0 h-full w-[200cqw]" style={{ '--tile': '100cqw', animation: 'tileX 3.4s linear infinite', willChange: 'transform' }} aria-hidden="true">
            {[0, 100, 200, 300].map((x) => (
              <g key={x} transform={`translate(${x} 0)`}>
                <path d={BEAT} fill="none" stroke="#ff5c8a" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
              </g>
            ))}
          </svg>
        </div>

        {/* the heart */}
        {step >= 1 ? (
          <div className="absolute left-1/2 top-[18%] w-[62cqw] -translate-x-1/2">
            <Reveal anim="zoom-in">
              <div style={{ animation: 'lubdub 1.5s ease-in-out 0.4s infinite', willChange: 'transform' }}>
                <div className="relative aspect-[100/92] w-full">
                  <svg viewBox="0 0 100 92" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
                    <defs>
                      <linearGradient id="lh-g" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stopColor="#ff7aa5" />
                        <stop offset="1" stopColor="#d6194f" />
                      </linearGradient>
                    </defs>
                    <path d={HEART} fill="url(#lh-g)" />
                    <path d="M16 22 C 18 14, 26 10, 33 10" stroke="#fff" strokeOpacity="0.5" strokeWidth="3" fill="none" strokeLinecap="round" />
                  </svg>
                  <div className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2">
                    <Avatar className="h-[31cqw] w-[31cqw] border-[1.1cqw] border-white" fallbackClassName="bg-[#8e1b45]" textClassName="font-playfair font-bold text-white" />
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        ) : null}

        {/* name */}
        {step >= 2 ? (
          <div className="absolute inset-x-[5cqw] top-[56%] text-center">
            <p className="font-script leading-none text-[#ffd1df]" style={{ fontSize: fitName(w.name, 15, { width: 80 }) }}>
              <SplitText text={w.name} stagger={70} anim="pop-in" />
            </p>
            <Reveal delay={700}>
              <p className="mt-[2.4cqw] font-playfair text-[3.6cqw] italic tracking-wide text-[#ffb3c8]">{together || 'I love you'}</p>
            </Reveal>
          </div>
        ) : null}

        {/* message */}
        {step >= 3 ? (
          <Reveal className="absolute inset-x-[7cqw] top-[69%]">
            <div className="rounded-[4cqw] border border-white/15 bg-[#2a0b1b]/90 px-[5cqw] py-[3.6cqw] text-center shadow-[0_0_8cqw_rgba(214,25,79,0.35)]">
              <p className="font-playfair italic leading-[1.35] text-[#ffe9ef]" style={{ fontSize: `${msgSize(w.message, 4.2, 3.1)}cqw` }}>
                <Typewriter text={w.message} speed={30} cursor={false} />
              </p>
              {w.hasFrom ? <p className="mt-[2cqw] font-script text-[6.4cqw] leading-none text-[#ff8fb0]">— {w.from}</p> : null}
            </div>
          </Reveal>
        ) : null}

        {step >= 4 ? (
          <div className="absolute inset-x-0 bottom-[2.4%] flex flex-wrap justify-center gap-[1.6cqw] px-[4cqw]">
            {w.wishes.map((t, i) => (
              <Reveal key={i} delay={i * 700} anim="pop-in">
                <span className="block rounded-full bg-[#ff5c8a]/25 px-[3cqw] py-[1.2cqw] text-[2.7cqw] text-[#ffd8e3]">♥ {t}</span>
              </Reveal>
            ))}
          </div>
        ) : null}
      </Board>
      <div className="absolute inset-0" onPointerDown={burst} data-bursts={bursts} />
    </Stage>
  );
}
