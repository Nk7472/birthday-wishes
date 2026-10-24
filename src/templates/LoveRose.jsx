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

// ring: how many petals, distance from the centre (cqw), size (cqw), colours, start delay (s)
const RINGS = [
  { n: 7, d: 12.5, s: 24, a0: 0, c: ['#e63a62', '#a50f35'], t: 0.0 },
  { n: 6, d: 8.8, s: 20, a0: 26, c: ['#f0496f', '#b8153d'], t: 0.5 },
  { n: 5, d: 5.4, s: 15.5, a0: 12, c: ['#f7587d', '#c41b46'], t: 1.0 },
  { n: 4, d: 2.4, s: 11, a0: 40, c: ['#ff7092', '#d3234f'], t: 1.5 },
];

function Rose({ start }) {
  return (
    <div className="relative h-[56cqw] w-[56cqw]" style={{ animation: 'floatSlow 7s ease-in-out infinite' }}>
      <div className="absolute left-1/2 top-1/2 h-0 w-0">
        {RINGS.flatMap((r, ri) =>
          Array.from({ length: r.n }, (_, i) => (
            <span
              key={`${ri}-${i}`}
              className="absolute"
              style={{
                width: `${r.s}cqw`,
                height: `${r.s * 1.08}cqw`,
                left: `${-r.s / 2}cqw`,
                top: `${-r.s * 0.54}cqw`,
                borderRadius: '50% 50% 46% 46% / 64% 64% 36% 36%',
                background: `radial-gradient(ellipse at 50% 78%, ${r.c[0]} 0%, ${r.c[1]} 78%)`,
                boxShadow: 'inset 0 -1.2cqw 2.4cqw rgba(60,0,15,0.35), 0 0.4cqw 1cqw rgba(60,0,15,0.25)',
                '--a': `${r.a0 + (360 / r.n) * i}deg`,
                '--d': `${-r.d}cqw`,
                animation: start ? `petalOpen 1.6s var(--ease-soft-spring) ${r.t + i * 0.09}s both` : 'none',
                opacity: start ? undefined : 0,
                transformOrigin: '50% 60%',
                willChange: 'transform',
              }}
            />
          )),
        )}
        <span className="absolute h-[7cqw] w-[7cqw] rounded-full" style={{ left: '-3.5cqw', top: '-3.5cqw', background: 'radial-gradient(circle at 40% 35%, #ff9bb3, #b0123a)', animation: start ? 'popIn 0.8s ease 2.2s both' : 'none', opacity: start ? undefined : 0 }} />
      </div>
    </div>
  );
}

export default function LoveRose() {
  const w = useWish();
  const step = useTimeline([300, 3600, 8000, 11500]);
  const [n, setN] = useState(0);
  const together = togetherText(w);

  useEffect(() => {
    if (step === 1) sfx.whoosh();
    if (step === 2) sfx.sparkle();
    if (step === 3) sfx.chime(988);
  }, [step]);

  const scatter = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    confetti.burst({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height, count: 16, spread: 120, angle: -90, power: 0.55, gravity: 0.5, emojis: ['🌹', '🌸'], size: 1.3, ttl: 3 });
    sfx.sparkle();
    setN((v) => v + 1);
  };

  return (
    <Stage className="bg-[#14040a] text-white">
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 34%, #4a0d22 0%, #220610 52%, #0c0206 100%)' }} />
      <Drift count={18} seed={11} anim="fall" size={[10, 22]} duration={[10, 18]} delay={[0, 16]} sway colors={['#e63a62', '#ff7092', '#c41b46']}>
        {(p) => <span className="block h-[1.25em] w-[1em] rounded-[60%_0_60%_0] opacity-70" style={{ background: p.color, fontSize: p.size }} />}
      </Drift>

      <Board className="pointer-events-none">
        {step >= 1 ? (
          <div className="absolute inset-x-0 top-[5%] text-center">
            <Reveal><p className="font-playfair text-[3.4cqw] uppercase tracking-[0.36em] text-[#ff9fb6]">For my love</p></Reveal>
            <p className="mt-[1cqw] font-script leading-none text-[#ffe1e8]" style={{ fontSize: fitName(w.name, 15, { width: 80 }) }}>
              <SplitText text={w.name} delay={500} stagger={80} anim="fade-up" />
            </p>
          </div>
        ) : null}

        {/* stem */}
        <div className="absolute left-1/2 top-[44%] h-[40%] w-[1.6cqw] origin-top -translate-x-1/2 rounded-full bg-gradient-to-b from-[#2e7d3a] to-[#134d1f]" style={{ animation: step >= 1 ? 'stemGrow 1.8s var(--ease-out) both' : 'none', transform: step >= 1 ? undefined : 'scaleY(0)' }}>
          <span className="absolute left-[130%] top-[34%] h-[6cqw] w-[11cqw] origin-left -rotate-[18deg] rounded-[100%_0_100%_0] bg-[#2f8a3e]" />
          <span className="absolute right-[130%] top-[58%] h-[6cqw] w-[11cqw] origin-right rotate-[18deg] rounded-[0_100%_0_100%] bg-[#25702f]" />
        </div>

        <div className="absolute left-1/2 top-[14%] -translate-x-1/2">
          <Rose start={step >= 1} />
        </div>

        {step >= 2 ? (
          <Reveal className="absolute left-[7%] top-[49%]">
            <Avatar className="h-[20cqw] w-[20cqw] border-[0.9cqw] border-[#ffb3c6]" fallbackClassName="bg-[#8e1b45]" textClassName="font-playfair font-bold text-white" style={{ boxShadow: '0 0 6cqw rgba(255,90,130,0.55)' }} />
          </Reveal>
        ) : null}
        {step >= 2 && together ? (
          <Reveal delay={500} className="absolute right-[6%] top-[52%] w-[33cqw] text-right">
            <p className="font-hand text-[5.6cqw] leading-tight text-[#ffb3c6]">{together}</p>
          </Reveal>
        ) : null}

        {step >= 3 ? (
          <Reveal className="absolute inset-x-[7cqw] top-[70%]">
            <div className="rounded-[4cqw] border border-[#ff7a9b]/30 bg-[#2b0813]/90 px-[5cqw] py-[3.4cqw] text-center shadow-[0_0_8cqw_rgba(230,58,98,0.35)]">
              <p className="font-playfair italic leading-[1.35] text-[#ffe9ef]" style={{ fontSize: `${msgSize(w.message, 4.2, 3.1)}cqw` }}>
                <Typewriter text={w.message} speed={30} cursor={false} />
              </p>
              {w.hasFrom ? <p className="mt-[2cqw] font-script text-[6.4cqw] leading-none text-[#ff8fb0]">— {w.from}</p> : null}
            </div>
          </Reveal>
        ) : null}
        {step >= 4 ? (
          <Reveal className="absolute inset-x-[6cqw] bottom-[2.6%] text-center">
            <p className="font-hand text-[4cqw] leading-snug text-[#ffb3c6]/90">{w.wishes.join('  ♥  ')}</p>
          </Reveal>
        ) : null}
      </Board>
      <div className="absolute inset-0" onPointerDown={scatter} data-n={n} />
    </Stage>
  );
}
