import { useEffect, useState } from 'react';
import Avatar from '../components/shared/Avatar';
import Drift from '../components/shared/Drift';
import { useTimeline } from '../components/shared/hooks';
import Reveal from '../components/shared/Reveal';
import Stage from '../components/shared/Stage';
import { useWish } from '../components/shared/WishContext';
import { sfx } from '../lib/audio';
import { confetti } from '../lib/confetti';
import { fitName } from '../lib/fit';

const GOLD = ['#f6e27a', '#d4af37', '#fff8e7', '#ffffff', '#b8892a'];
const foil = 'bg-[linear-gradient(110deg,#8a6a1f_0%,#f6e27a_22%,#fff8d6_40%,#d4af37_58%,#8a6a1f_80%,#f6e27a_100%)] bg-[length:220%_100%] bg-[position:30%_0] bg-clip-text text-transparent';

function Curtain({ side, open }) {
  const left = side === 'left';
  return (
    <div
      className="absolute top-0 z-30 h-full w-1/2 will-change-transform"
      style={{
        [left ? 'left' : 'right']: 0,
        transform: open ? `translateX(${left ? '-86%' : '86%'})` : 'translateX(0)',
        transition: 'transform 3.4s cubic-bezier(0.6, 0.02, 0.2, 1)',
        background: 'repeating-linear-gradient(90deg, #3a0814 0, #7d1a30 4.5%, #a02440 7%, #6a1226 10%, #3a0814 14%)',
        boxShadow: left ? '2cqmin 0 4cqmin rgba(0,0,0,0.6)' : '-2cqmin 0 4cqmin rgba(0,0,0,0.6)',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/50" />
      <div className="absolute bottom-0 h-[3cqmin] w-full bg-gradient-to-b from-[#d4af37] to-[#8a6a1f]" />
      <div className={`absolute top-[46%] ${left ? 'right-[4%]' : 'left-[4%]'} flex flex-col items-center`}>
        <div className="h-[2cqmin] w-[0.6cqmin] bg-[#d4af37]" />
        <div className="h-[5cqmin] w-[3.4cqmin] rounded-b-full bg-gradient-to-b from-[#f6e27a] to-[#8a6a1f]" />
        <div className="h-[6cqmin] w-[2cqmin] bg-[repeating-linear-gradient(to_bottom,#d4af37_0,#d4af37_0.5cqmin,#8a6a1f_0.5cqmin,#8a6a1f_1cqmin)]" />
      </div>
    </div>
  );
}

function Chandelier() {
  const arms = [-34, -22, -10, 0, 10, 22, 34];
  return (
    <svg viewBox="-50 0 100 54" className="pointer-events-none absolute left-1/2 top-[5cqmin] z-20 w-[34cqmin] -translate-x-1/2" aria-hidden="true">
      <line x1="0" y1="0" x2="0" y2="12" stroke="#d4af37" strokeWidth="0.8" />
      <path d="M-34 24 Q0 36 34 24" fill="none" stroke="#d4af37" strokeWidth="1.2" />
      <circle cx="0" cy="12" r="3" fill="#f6e27a" />
      {arms.map((x, i) => {
        const y = 24 + (1 - Math.abs(x) / 34) * 7 - 1;
        return (
          <g key={x}>
            <line x1={x} y1={y - 8} x2={x} y2={y} stroke="#d4af37" strokeWidth="0.6" />
            <path d={`M${x} ${y} l-2.4 6 l2.4 6 l2.4 -6 Z`} fill="#fff8e7" opacity="0.85" className="animate-twinkle" style={{ animationDelay: `${i * 0.45}s` }} />
            <circle cx={x} cy={y - 9} r="1.4" fill="#ffd98a" className="animate-flicker" style={{ animationDelay: `${i * 0.2}s` }} />
          </g>
        );
      })}
    </svg>
  );
}

function Flute({ tilt, className = '' }) {
  return (
    <div className={`relative ${className}`} style={{ transform: `rotate(${tilt}deg)`, transformOrigin: '50% 100%', transition: 'transform 0.7s cubic-bezier(0.5,0,0.2,1.4)' }}>
      <svg viewBox="0 0 40 110" className="w-full" aria-hidden="true">
        <defs>
          <linearGradient id="gg-flute" x1="0" x2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0.08" />
            <stop offset="1" stopColor="#fff" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        <path d="M8 4 H32 L30 56 Q29 70 20 72 Q11 70 10 56 Z" fill="url(#gg-flute)" stroke="#fff8e7" strokeOpacity="0.8" strokeWidth="1" />
        <path d="M10 22 H30 L29.5 56 Q29 69 20 71 Q11 69 10.5 56 Z" fill="#f6e27a" opacity="0.8" />
        <rect x="19" y="72" width="2" height="26" fill="#fff8e7" opacity="0.7" />
        <ellipse cx="20" cy="102" rx="12" ry="3.4" fill="#fff8e7" opacity="0.7" />
        {[0, 1, 2, 3].map((b) => (
          <circle key={b} cx={14 + b * 4} cy="60" r="1.1" fill="#fffbe0" style={{ animation: 'bubbleUp 2.4s ease-in infinite', animationDelay: `${b * 0.55}s` }} />
        ))}
      </svg>
    </div>
  );
}

export default function GoldenGala() {
  const w = useWish();
  const step = useTimeline([600, 3000, 4200, 5600, 7000, 9200]);
  const [clink, setClink] = useState(false);
  const [flare, setFlare] = useState(0);

  useEffect(() => {
    if (step === 1) sfx.whoosh();
    if (step === 3) sfx.chime(659);
    if (step === 5) {
      setClink(true);
      sfx.chime(1175);
      sfx.sparkle();
      confetti.burst({ x: 0.5, y: 0.62, count: 36, spread: 360, power: 0.5, gravity: 0.5, shapes: ['star'], colors: GOLD });
    }
  }, [step]);

  const pop = () => {
    setFlare((f) => f + 1);
    sfx.pop();
    sfx.sparkle();
    confetti.cannons({ colors: GOLD });
  };

  const head = w.ordinal ? `Happy ${w.ordinal} Birthday` : 'Happy Birthday';

  return (
    <Stage className="bg-[#0c0a09] text-[#fff8e7]">
      {/* stage behind the curtains */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,#2a1b10_0%,#0c0a09_70%)]" />
      <div className="absolute inset-x-0 bottom-0 h-[24%] bg-[linear-gradient(to_bottom,#1a1210,#050403)]">
        <div className="absolute left-1/2 top-[6%] h-[40%] w-[80%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse,rgba(246,226,122,0.28),transparent_70%)]" />
      </div>
      {step >= 2 ? (
        <div
          className="absolute left-1/2 top-0 h-[78%] w-[92%] -translate-x-1/2 animate-fade-in bg-gradient-to-b from-[#fff3c4]/30 via-[#fff3c4]/10 to-transparent blur-[0.6cqmin]"
          style={{ clipPath: 'polygon(42% 0, 58% 0, 100% 100%, 0 100%)', animation: 'fadeIn 2s ease both, spotPulse 5s ease-in-out infinite 2s' }}
        />
      ) : null}
      <Drift count={22} seed={8} anim="rise" size={[2, 6]} duration={[14, 28]} delay={[0, 26]} className="z-10 opacity-80">
        {(p) => <div className="aspect-square w-full rounded-full bg-[#f6e27a] shadow-[0_0_1cqmin_#f6e27a]" style={{ opacity: 0.35 + (p.i % 4) * 0.15 }} />}
      </Drift>
      <Chandelier />

      {/* content */}
      <div className="absolute inset-0 z-20 mx-auto flex h-full w-full max-w-[min(100cqw,70cqh)] flex-col items-center px-[6cqmin] pb-[12cqmin] pt-[30cqmin] text-center" onPointerDown={pop}>
        <Reveal anim="fade-in" delay={3200} className="font-cinzel text-[clamp(0.6rem,2.6cqmin,1rem)] font-bold tracking-[0.34em] text-[#d4af37]">
          TONIGHT WE CELEBRATE
        </Reveal>

        <Reveal anim="drop-in" delay={3600} duration={1300} className="relative mt-[3cqmin]">
          <div className="origin-top animate-[settle_2.4s_ease-out_5.1s_both]">
            <svg viewBox="0 0 100 24" className="absolute -top-[10cqmin] left-1/2 w-[22cqmin] -translate-x-1/2" aria-hidden="true">
              <path d="M2 24 L50 2 L98 24" fill="none" stroke="#d4af37" strokeWidth="1.2" />
              <circle cx="50" cy="2" r="2.6" fill="#f6e27a" />
            </svg>
            <div className="rounded-[1.4cqmin] bg-gradient-to-br from-[#f6e27a] via-[#d4af37] to-[#8a6a1f] p-[1.5cqmin] shadow-[0_2cqmin_5cqmin_rgba(0,0,0,0.7),0_0_6cqmin_rgba(212,175,55,0.3)]">
              <div className="rounded-[0.8cqmin] bg-[#2a050c] p-[0.9cqmin]">
                <div className="relative h-[min(46cqmin,27cqh)] w-[min(37cqmin,22cqh)]">
                  <Avatar rounded="rounded-[0.5cqmin]" className="h-full w-full" fallbackClassName="bg-gradient-to-b from-[#7d1a30] to-[#2a050c]" textClassName="font-playfair font-extrabold text-[#f6e27a]" />
                  <div className="absolute inset-0 rounded-[0.5cqmin] shadow-[inset_0_0_3cqmin_rgba(0,0,0,0.55)]" />
                </div>
              </div>
              {[['-left-[1cqmin] -top-[1cqmin]', 0], ['-right-[1cqmin] -top-[1cqmin]', 90], ['-right-[1cqmin] -bottom-[1cqmin]', 180], ['-left-[1cqmin] -bottom-[1cqmin]', 270]].map(([pos, r]) => (
                <svg key={r} viewBox="0 0 20 20" className={`absolute h-[6cqmin] w-[6cqmin] ${pos}`} style={{ transform: `rotate(${r}deg)` }} aria-hidden="true">
                  <path d="M2 2 H12 Q4 4 4 12 V2 Z M3 3 Q10 3 10 10" fill="#fff3b0" stroke="#8a6a1f" strokeWidth="0.6" />
                </svg>
              ))}
            </div>
          </div>
        </Reveal>

        <div className="mt-[4.5cqmin] min-h-[12cqmin]">
          {step >= 4 ? (
            <Reveal anim="zoom-in" duration={1400}>
              <div className={`font-playfair font-extrabold italic leading-[1.1] ${foil}`} style={{ fontSize: fitName(w.name, 13, { factor: 0.5 }) }}>
                {w.name}
              </div>
              <div className="mt-[1.4cqmin] font-cinzel text-[clamp(0.7rem,3cqmin,1.2rem)] font-bold tracking-[0.2em] text-[#f6e27a]">{head.toUpperCase()}</div>
            </Reveal>
          ) : null}
        </div>

        <div className="relative mt-[3cqmin] flex h-[min(20cqmin,11cqh)] items-end justify-center">
          {step >= 4 ? (
            <Reveal anim="fade-in" className="flex items-end justify-center">
              <Flute tilt={clink ? 6 : -16} className="w-[9cqmin]" />
              <Flute tilt={clink ? -6 : 16} className="ml-[2.4cqmin] w-[9cqmin]" />
            </Reveal>
          ) : null}
        </div>

        <div className="flex-1" />

        {step >= 6 ? (
          <Reveal anim="fade-up" duration={1200} className="w-full max-w-[92cqmin] rounded-[1.4cqmin] border border-[#d4af37]/70 bg-[#0c0a09]/85 p-[1cqmin] shadow-[0_2cqmin_5cqmin_rgba(0,0,0,0.6)]">
            <div className="rounded-[1cqmin] border border-[#d4af37]/40 px-[4.4cqmin] py-[3.4cqmin]">
              <p className="font-playfair text-[clamp(0.8rem,3.3cqmin,1.25rem)] leading-relaxed text-[#fff8e7]">{w.message}</p>
              {w.hasFrom ? <p className={`mt-[1.8cqmin] font-script text-[clamp(1.1rem,4.8cqmin,1.9rem)] font-bold ${foil}`}>With love, {w.from}</p> : null}
              <div className="mx-auto my-[2.4cqmin] h-px w-[40%] bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
              <div className="flex flex-col gap-[1cqmin] font-playfair text-[clamp(0.7rem,2.9cqmin,1.1rem)] italic tracking-[0.04em] text-[#e9d58c]">
                {w.wishes.map((x, i) => (
                  <Reveal key={i} anim="fade-in" delay={500 + i * 600}>
                    <span className="text-[#d4af37]">✦</span> {x}
                  </Reveal>
                ))}
              </div>
            </div>
          </Reveal>
        ) : null}
      </div>

      {flare > 0 ? <div key={flare} className="pointer-events-none absolute inset-0 z-[25] animate-flash bg-[radial-gradient(circle_at_50%_40%,rgba(255,243,196,0.7),transparent_60%)]" /> : null}

      {/* valance + curtains */}
      <div className="absolute inset-x-0 top-0 z-40 h-[9cqmin] bg-[repeating-linear-gradient(90deg,#5b0f1f_0,#8c1c35_5cqmin,#5b0f1f_10cqmin)] shadow-[0_1cqmin_3cqmin_rgba(0,0,0,0.6)]">
        <div className="absolute inset-x-0 bottom-0 h-[1.6cqmin] bg-gradient-to-b from-[#f6e27a] to-[#8a6a1f]" />
        <div className="absolute inset-x-0 -bottom-[2.4cqmin] flex justify-around">
          {Array.from({ length: 14 }).map((_, i) => (
            <span key={i} className="h-[2.6cqmin] w-[1.4cqmin] rounded-b-full bg-[#d4af37]" />
          ))}
        </div>
      </div>
      <Curtain side="left" open={step >= 1} />
      <Curtain side="right" open={step >= 1} />
    </Stage>
  );
}
