import { useEffect, useMemo, useState } from 'react';
import Avatar from '../components/shared/Avatar';
import Drift from '../components/shared/Drift';
import { useTimeline } from '../components/shared/hooks';
import Reveal from '../components/shared/Reveal';
import SplitText from '../components/shared/SplitText';
import Stage from '../components/shared/Stage';
import { useWish } from '../components/shared/WishContext';
import { sfx } from '../lib/audio';
import { confetti } from '../lib/confetti';
import { fitName } from '../lib/fit';

const PENTA = [523.3, 587.3, 659.3, 784, 880, 1046.5, 1174.7, 1318.5];
const PETALS = ['#ff8f8f', '#b79cff', '#ffd54a', '#ff9ec7', '#ffffff', '#ffb17a', '#8fd1ff', '#ff8f8f', '#c9a6ff'];

/** A flower head: n petals around a centre. Scales to its container width. */
function Flower({ color, n = 7, centre = '#ffcf33', className = '' }) {
  return (
    <svg viewBox="-50 -50 100 100" className={className} style={{ overflow: 'visible' }} aria-hidden="true">
      {Array.from({ length: n }).map((_, i) => (
        <ellipse key={i} cx="0" cy="-26" rx="12" ry="22" fill={color} stroke="rgba(0,0,0,0.08)" strokeWidth="1" transform={`rotate(${(360 / n) * i})`} />
      ))}
      <circle r="13" fill={centre} />
      <circle r="13" fill="url(#none)" />
      <circle cx="-3" cy="-4" r="4" fill="#fff" opacity="0.4" />
    </svg>
  );
}

const STEMS = [
  { x: 6, h: 22, s: 14, c: 0, n: 6 },
  { x: 19, h: 30, s: 17, c: 1, n: 8 },
  { x: 32, h: 20, s: 13, c: 2, n: 7 },
  { x: 46, h: 34, s: 19, c: 3, n: 9 },
  { x: 60, h: 24, s: 14, c: 4, n: 7 },
  { x: 73, h: 31, s: 17, c: 5, n: 8 },
  { x: 86, h: 21, s: 14, c: 6, n: 6 },
];

function Butterfly({ color, size, anim, delay, dur }) {
  return (
    <div className="pointer-events-none absolute left-0 top-0 z-30" style={{ width: `${size}cqmin`, animation: `${anim} ${dur}s linear infinite`, animationDelay: `${delay}s` }}>
      <div className="animate-float" style={{ animationDuration: '2.2s' }}>
        <svg viewBox="0 0 40 30" className="w-full" aria-hidden="true">
          <g style={{ transformOrigin: '20px 15px', animation: 'flap 0.45s ease-in-out infinite' }}>
            <path d="M20 15 C 12 0, 0 2, 2 12 C 3 20, 14 20, 20 15 Z" fill={color} />
            <path d="M20 15 C 28 0, 40 2, 38 12 C 37 20, 26 20, 20 15 Z" fill={color} />
            <path d="M20 16 C 13 18, 6 28, 12 28 C 17 28, 20 22, 20 16 Z" fill={color} opacity="0.8" />
            <path d="M20 16 C 27 18, 34 28, 28 28 C 23 28, 20 22, 20 16 Z" fill={color} opacity="0.8" />
            <circle cx="9" cy="10" r="2" fill="#fff" opacity="0.7" />
            <circle cx="31" cy="10" r="2" fill="#fff" opacity="0.7" />
          </g>
          <rect x="19" y="8" width="2" height="14" rx="1" fill="#5b3a2a" />
        </svg>
      </div>
    </div>
  );
}

export default function EnchantedGarden() {
  const w = useWish();
  const step = useTimeline([300, 3600, 4800, 6400, 8400]);
  const [bloomed, setBloomed] = useState({});
  const [flies, setFlies] = useState([]);
  const head = w.ordinal ? `Happy ${w.ordinal} Birthday` : 'Happy Birthday';

  // cascade of chimes as the flowers open
  useEffect(() => {
    const ids = STEMS.map((_, i) => setTimeout(() => sfx.chime(PENTA[i % PENTA.length]), 1700 + i * 330));
    return () => ids.forEach(clearTimeout);
  }, []);
  useEffect(() => {
    if (step === 3) sfx.sparkle();
  }, [step]);

  const wreath = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
        return { x: 50 + Math.cos(a) * 50, y: 50 + Math.sin(a) * 50, c: PETALS[i % PETALS.length], s: 15 + (i % 3) * 3, d: i };
      }),
    [],
  );

  const pop = (i, e) => {
    e.stopPropagation();
    setBloomed((b) => ({ ...b, [i]: (b[i] || 0) + 1 }));
    sfx.chime(PENTA[(i * 3 + (bloomed[i] || 0)) % PENTA.length] * 1.5);
    const r = e.currentTarget.getBoundingClientRect();
    const st = e.currentTarget.closest('[data-stage]').getBoundingClientRect();
    confetti.burst({ x: (r.left + r.width / 2 - st.left) / st.width, y: (r.top + r.height / 2 - st.top) / st.height, count: 22, spread: 360, power: 0.5, gravity: 0.7, shapes: ['circle'], colors: [PETALS[STEMS[i].c], '#fff', '#ffd54a'] });
    confetti.emoji(['🌸', '🌼'], { count: 6, power: 0.7 });
  };

  const sky = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    sfx.sparkle();
    setFlies((f) => [...f.slice(-3), { id, y: ((e.clientY - r.top) / r.height) * 100, c: PETALS[id % 5] }]);
    setTimeout(() => setFlies((f) => f.filter((q) => q.id !== id)), 9000);
  };

  return (
    <Stage className="bg-[linear-gradient(to_bottom,#cdeaff_0%,#ffd9ec_46%,#ffe5d0_75%,#d5f5c8_100%)]" >
      <div className="absolute inset-0" onPointerDown={sky}>
        {/* sun + rays */}
        <div className="absolute -top-[18cqmin] left-1/2 h-[80cqmin] w-[80cqmin] -translate-x-1/2 animate-spin-slow opacity-60 [animation-duration:90s]" style={{ background: 'repeating-conic-gradient(from 0deg, rgba(255,244,190,0.9) 0 6deg, transparent 6deg 18deg)', maskImage: 'radial-gradient(circle, #000 20%, transparent 70%)', WebkitMaskImage: 'radial-gradient(circle, #000 20%, transparent 70%)' }} />
        <div className="absolute -top-[6cqmin] left-1/2 h-[26cqmin] w-[26cqmin] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,#fffbe0_0%,#ffe9a8_55%,transparent_72%)]" />

        {/* hills */}
        <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[38%] w-full" aria-hidden="true">
          <path d="M0 14 Q20 2 42 10 T100 6 V40 H0 Z" fill="#b6e6a4" />
          <path d="M0 22 Q26 10 52 20 T100 16 V40 H0 Z" fill="#8fd18a" />
          <path d="M0 30 Q30 20 60 28 T100 26 V40 H0 Z" fill="#6cbf72" />
        </svg>

        <Drift count={16} seed={31} anim="twinkle" size={[3, 7]} duration={[3, 7]} delay={[0, 7]} y={[20, 90]} colors={['#fff7b0', '#ffffff', '#ffe9a8']}>
          {(p) => <div className="aspect-square w-full rounded-full shadow-[0_0_1.4cqmin_#fff7b0]" style={{ background: p.color }} />}
        </Drift>
        <Drift count={9} seed={5} anim="fall" sway size={[10, 18]} duration={[11, 20]} delay={[0, 20]} colors={['#ffb3c9', '#ffd1e0', '#ffffff']}>
          {(p) => <div className="aspect-[3/4] w-full rounded-[60%_0_60%_0]" style={{ background: p.color, transform: `rotate(${p.rot * 3}deg)`, opacity: 0.85 }} />}
        </Drift>

        <Butterfly color="#ff8fb8" size={13} anim="flightA" delay={-4} dur={26} />
        <Butterfly color="#8fb8ff" size={11} anim="flightB" delay={-12} dur={32} />
        <Butterfly color="#ffc94d" size={12} anim="flightA" delay={-19} dur={38} />
        {flies.map((f) => (
          <div key={f.id} className="absolute inset-0">
            <Butterfly color={f.c} size={14} anim="flightB" delay={0} dur={8} />
          </div>
        ))}
      </div>

      {/* foreground column */}
      <div className="pointer-events-none absolute inset-0 z-20 mx-auto flex h-full w-full max-w-[min(100cqw,74cqh)] flex-col items-center px-[5cqmin] pb-[min(46cqmin,25cqh)] pt-[min(13cqmin,6cqh)]">
        {/* wreath + avatar */}
        <div className="relative h-[min(44cqmin,25cqh)] w-[min(44cqmin,25cqh)] shrink-0">
          {step >= 1 ? (
            <Reveal anim="zoom-in" duration={1800} className="absolute inset-[11%]">
              <div className="h-full w-full rounded-full bg-white p-[0.8cqmin] shadow-[0_1cqmin_3cqmin_rgba(120,80,100,0.35)]">
                <Avatar className="h-full w-full" fallbackClassName="bg-gradient-to-br from-[#ffb3c9] to-[#b79cff]" textClassName="font-script font-bold text-white" />
              </div>
            </Reveal>
          ) : null}
          {wreath.map((f) => (
            <div key={f.d} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${f.x}%`, top: `${f.y}%`, width: `${f.s}%` }}>
              <div style={{ animation: 'bloom 0.8s cubic-bezier(0.34,1.56,0.64,1) both', animationDelay: `${600 + f.d * 140}ms` }}>
                <Flower color={f.c} n={6} className="w-full" />
              </div>
            </div>
          ))}
          {w.ageText && step >= 3 ? (
            <Reveal anim="pop-in" className="absolute -bottom-[1cqmin] -right-[1cqmin] grid h-[11cqmin] w-[11cqmin] place-items-center rounded-full bg-[#ff8fb8] font-script text-[6cqmin] font-bold text-white shadow-lg ring-[0.8cqmin] ring-white">
              {w.ageText}
            </Reveal>
          ) : null}
        </div>

        <div className="mt-[2.4cqmin] text-center">
          {step >= 2 ? (
            <>
              <div style={{ fontSize: fitName(w.name, 10.5) }} className="leading-[1.1]">
                <SplitText text={w.name} stagger={80} anim="pop-in" className="font-script font-bold text-[#d6478a] [text-shadow:0_0.5cqmin_0_#fff,0_1.4cqmin_2cqmin_rgba(214,71,138,0.3)]" />
              </div>
              <Reveal anim="fade-in" delay={800} className="mt-[1cqmin] font-script text-[clamp(1.2rem,5.4cqmin,2.2rem)] font-bold text-[#7a5a9a]">
                {head}
              </Reveal>
            </>
          ) : null}
        </div>

        {/* wishes drift up as petals */}
        <div className="relative mt-[1cqmin] h-[8cqmin] w-full shrink-0">
          {step >= 4
            ? w.wishes.map((x, i) => (
                <p key={i} className="absolute inset-x-0 top-0 text-center font-ui text-[clamp(0.8rem,3.4cqmin,1.3rem)] font-semibold italic text-[#7a4a7a]" style={{ opacity: 0, animation: 'wishCycle 18s ease-in-out infinite', animationDelay: `${i * 6 + 0.5}s` }}>
                  ❀ {x} ❀
                </p>
              ))
            : null}
        </div>

        <div className="flex-1" />

        {step >= 4 ? (
          <Reveal anim="fade-up" className="relative w-full max-w-[88cqmin]">
            {/* vine hanger */}
            <div className="absolute -top-[7cqmin] left-[18%] h-[8cqmin] w-[0.5cqmin] bg-[#5b8a3a]" />
            <div className="absolute -top-[7cqmin] right-[18%] h-[8cqmin] w-[0.5cqmin] bg-[#5b8a3a]" />
            <div className="origin-top animate-sway [animation-duration:6s]">
              <div className="rounded-[2.4cqmin] border-[0.6cqmin] border-[#e7c98a] bg-[#fff9ea] px-[5cqmin] py-[3.6cqmin] text-center shadow-[0_1.6cqmin_3cqmin_rgba(100,70,40,0.3)]">
                <p className="font-ui text-[clamp(0.82rem,3.4cqmin,1.3rem)] leading-snug text-[#5a4060]">{w.message}</p>
                {w.hasFrom ? <p className="mt-[1.6cqmin] font-script text-[clamp(1.2rem,5cqmin,2rem)] font-bold text-[#d6478a]">— {w.from}</p> : null}
              </div>
            </div>
          </Reveal>
        ) : null}
      </div>

      {/* flower row (tappable) */}
      <div className="absolute inset-x-0 bottom-0 z-30 mx-auto h-[min(56cqmin,30cqh)] w-full max-w-[min(100cqw,90cqh)]">
        {STEMS.map((f, i) => (
          <button key={i} type="button" onPointerDown={(e) => pop(i, e)} aria-label="Bloom the flower" className="absolute bottom-0 block -translate-x-1/2" style={{ left: `${f.x + 4}%`, height: `${f.h * 2.5}%`, width: `${f.s}cqmin` }}>
            <div className="absolute bottom-0 left-1/2 w-[0.8cqmin] -translate-x-1/2 origin-bottom bg-gradient-to-t from-[#3f9b5a] to-[#7bc47f]" style={{ height: '88%', animation: 'grow 1.3s cubic-bezier(0.3,1,0.4,1) both', animationDelay: `${i * 150}ms` }} />
            <div className="absolute bottom-[26%] left-1/2 h-[7cqmin] w-[5cqmin] origin-bottom-left rounded-[0_100%_0_100%] bg-[#6cbf72]" style={{ animation: 'bloom 0.8s ease-out both', animationDelay: `${600 + i * 150}ms` }} />
            <div className="absolute inset-x-0 top-0 origin-bottom animate-sway" style={{ animationDuration: `${3.4 + (i % 3) * 0.7}s`, animationDelay: `${i * 0.3}s` }}>
              <div key={bloomed[i] || 0} style={{ animation: bloomed[i] ? 'squish 0.7s ease-out' : `bloom 0.9s cubic-bezier(0.34,1.56,0.64,1) both ${1500 + i * 330}ms` }}>
                <Flower color={PETALS[f.c]} n={f.n} className="w-full" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </Stage>
  );
}
