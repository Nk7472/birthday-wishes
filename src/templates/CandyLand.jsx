import { useEffect, useMemo, useState } from 'react';
import Avatar from '../components/shared/Avatar';
import Board from '../components/shared/Board';
import Drift from '../components/shared/Drift';
import { useTimeline } from '../components/shared/hooks';
import Reveal from '../components/shared/Reveal';
import Stage from '../components/shared/Stage';
import { useWish } from '../components/shared/WishContext';
import { sfx } from '../lib/audio';
import { confetti } from '../lib/confetti';
import { fitName } from '../lib/fit';

const CANDY = ['#ff6fa5', '#ffb23f', '#41d6a8', '#8b7cff', '#4dc9ff', '#ff8a5c'];
const jellyStyle = (c) => ({
  color: '#fff',
  WebkitTextStroke: `0.9cqmin ${c}`,
  paintOrder: 'stroke fill',
  textShadow: `0 0.8cqmin 0 ${c}, 0 1.4cqmin 1.6cqmin rgba(120,40,100,0.3)`,
});

function JellyWord({ text, delay = 0, size, stagger = 90, offset = 0 }) {
  return (
    <div className="flex flex-wrap justify-center font-fredoka font-bold leading-none" style={{ fontSize: size, gap: '0 0.04em' }} aria-label={text}>
      {[...text].map((ch, i) => (
        <span key={i} className="inline-block" style={{ opacity: 0, animation: 'jelly 0.95s cubic-bezier(0.3,0.9,0.4,1) both', animationDelay: `${delay + i * stagger}ms` }} aria-hidden="true">
          <span className="inline-block" style={{ ...jellyStyle(CANDY[(i + offset) % CANDY.length]), animation: 'wiggle 3.2s ease-in-out infinite', animationDelay: `${(i * 0.23) % 2}s` }}>
            {ch === ' ' ? ' ' : ch}
          </span>
        </span>
      ))}
    </div>
  );
}

function Lolly({ c1, c2 }) {
  return (
    <svg viewBox="0 0 40 80" className="h-full w-full" aria-hidden="true">
      <rect x="18.4" y="30" width="3.2" height="48" rx="1.6" fill="#fff" stroke="#e9d8e8" strokeWidth="0.5" />
      <circle cx="20" cy="20" r="17" fill={c1} />
      <path d="M20 20 m0 0 a3 3 0 0 1 6 0 a6 6 0 0 1 -12 0 a9 9 0 0 1 18 0 a12 12 0 0 1 -24 0 a15 15 0 0 1 30 0" fill="none" stroke={c2} strokeWidth="2.6" strokeLinecap="round" />
      <ellipse cx="13" cy="11" rx="4" ry="2.4" fill="#fff" opacity="0.55" transform="rotate(-30 13 11)" />
    </svg>
  );
}
function Gumdrop({ c }) {
  return (
    <svg viewBox="0 0 40 40" className="h-full w-full" aria-hidden="true">
      <path d="M4 36 C4 14, 12 4, 20 4 C28 4, 36 14, 36 36 Z" fill={c} />
      {[8, 14, 20, 26, 32].map((x) => (
        <circle key={x} cx={x} cy="36" r="1.7" fill="#fff" opacity="0.55" />
      ))}
      <ellipse cx="14" cy="14" rx="3.6" ry="6" fill="#fff" opacity="0.5" transform="rotate(20 14 14)" />
    </svg>
  );
}
function Cupcake({ c }) {
  return (
    <svg viewBox="0 0 40 44" className="h-full w-full" aria-hidden="true">
      <path d="M8 22 L11 42 H29 L32 22 Z" fill="#ffd9a8" />
      {[14, 19, 24].map((x) => (
        <line key={x} x1={x} y1="24" x2={x + 0.6} y2="41" stroke="#e8b078" strokeWidth="1" />
      ))}
      <path d="M6 24 C2 16, 12 14, 12 10 C12 4, 20 2, 21 6 C26 2, 34 8, 28 12 C38 14, 36 24, 32 24 Z" fill={c} />
      {[[14, 16], [22, 12], [27, 19], [18, 20]].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="3.2" height="1.2" rx="0.6" fill={['#fff', '#ffe14d', '#41d6a8', '#8b7cff'][i]} transform={`rotate(${i * 40 - 30} ${x} ${y})`} />
      ))}
      <circle cx="20" cy="4" r="2.6" fill="#ff3d6e" />
    </svg>
  );
}
function Bear({ c }) {
  return (
    <svg viewBox="0 0 40 44" className="h-full w-full" aria-hidden="true">
      <circle cx="9" cy="10" r="5" fill={c} />
      <circle cx="31" cy="10" r="5" fill={c} />
      <ellipse cx="20" cy="30" rx="11" ry="12" fill={c} />
      <circle cx="20" cy="15" r="9.5" fill={c} />
      <circle cx="16.5" cy="14" r="1.2" fill="#3a1d3a" />
      <circle cx="23.5" cy="14" r="1.2" fill="#3a1d3a" />
      <ellipse cx="20" cy="18" rx="2.4" ry="1.6" fill="#fff" opacity="0.5" />
      <ellipse cx="14" cy="9" rx="3" ry="1.8" fill="#fff" opacity="0.5" />
    </svg>
  );
}

const ITEMS = [
  { C: Lolly, props: { c1: '#ff6fa5', c2: '#fff' }, x: 2, y: 22, s: 13 },
  { C: Bear, props: { c: '#ff8a5c' }, x: 2, y: 47, s: 11 },
  { C: Cupcake, props: { c: '#ff9ec7' }, x: 15, y: 36, s: 12 },
  { C: Lolly, props: { c1: '#8b7cff', c2: '#fff' }, x: 85, y: 22, s: 12 },
  { C: Gumdrop, props: { c: '#41d6a8' }, x: 86, y: 47, s: 11 },
  { C: Gumdrop, props: { c: '#ffb23f' }, x: 75, y: 35, s: 10 },
  { C: Cupcake, props: { c: '#b79cff' }, x: 82, y: 90, s: 12 },
  { C: Bear, props: { c: '#4dc9ff' }, x: 4, y: 90, s: 12 },
];

export default function CandyLand() {
  const w = useWish();
  const step = useTimeline([200, 1700, 3600, 5600]);
  const [squished, setSquished] = useState({});
  const sprinkleColors = useMemo(() => ['#ff6fa5', '#ffb23f', '#41d6a8', '#8b7cff', '#fff'], []);

  useEffect(() => {
    if (step === 1) sfx.pop();
    if (step === 2) sfx.sparkle();
    if (step === 3) sfx.tada();
  }, [step]);

  const squish = (i, e) => {
    e.stopPropagation();
    setSquished((s) => ({ ...s, [i]: (s[i] || 0) + 1 }));
    sfx.pop();
    const r = e.currentTarget.getBoundingClientRect();
    const st = e.currentTarget.closest('[data-stage]').getBoundingClientRect();
    confetti.burst({ x: (r.left + r.width / 2 - st.left) / st.width, y: (r.top + r.height / 2 - st.top) / st.height, count: 28, spread: 360, power: 0.5, gravity: 0.9, shapes: ['rect'], size: 0.8, colors: sprinkleColors });
    if (ITEMS[i].C === Cupcake) confetti.emoji(['🍭', '🍬', '🍩', '🧁']);
  };

  const nameSize = fitName(w.name, 10, { factor: 0.62 });

  return (
    <Stage className="bg-[linear-gradient(to_bottom,#ffd6ec_0%,#e9d4ff_45%,#c9f3ff_100%)]">
      {/* rainbow + sun */}
      <div className="absolute inset-x-0 top-[9%] h-[70%] overflow-hidden opacity-75">
        {['#ff6fa5', '#ffb23f', '#ffe66d', '#41d6a8', '#4dc9ff', '#8b7cff'].map((c, i) => {
          const wdt = 104 - i * 5.2;
          return <div key={c} className="absolute left-1/2 top-0 h-full -translate-x-1/2 border-[2.4cqmin] border-b-0" style={{ borderColor: c, width: `${wdt}cqmin`, borderTopLeftRadius: `${wdt / 2}cqmin`, borderTopRightRadius: `${wdt / 2}cqmin`, marginTop: `${i * 2.4}cqmin` }} />;
        })}
      </div>
      <div className="absolute -right-[8cqmin] top-[3%] h-[24cqmin] w-[24cqmin] animate-spin-slow">
        <Lolly c1="#ffe66d" c2="#ffb23f" />
      </div>

      {/* clouds */}
      <Drift count={5} seed={3} anim="float-slow" size={[70, 130]} duration={[8, 12]} y={[4, 40]} x={[-8, 80]}>
        {(p) => <div className="h-[0.5em] rounded-full bg-white/80" style={{ fontSize: p.size, boxShadow: '0.25em -0.18em 0 0.04em #fff, -0.25em -0.1em 0 -0.02em #fff' }} />}
      </Drift>

      {/* falling sprinkles */}
      <Drift count={26} seed={17} anim="fall" size={[7, 13]} duration={[8, 15]} delay={[0, 15]} colors={sprinkleColors} className="z-10">
        {(p) => <div className="aspect-[3/1] w-full rounded-full" style={{ background: p.color, transform: `rotate(${p.rot * 4}deg)` }} />}
      </Drift>

      {/* frosting hills */}
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[34%] w-full" aria-hidden="true">
        <path d="M0 14 Q18 2 36 12 T72 10 T100 8 V40 H0 Z" fill="#ff9ec7" />
        <path d="M0 22 Q20 12 42 21 T100 18 V40 H0 Z" fill="#ffc2dd" />
        <path d="M0 14 Q18 2 36 12 T72 10 T100 8 V12 Q80 16 64 14 T30 16 T0 18 Z" fill="#fff" opacity="0.9" />
      </svg>

      {/* content */}
      <div className="pointer-events-none absolute inset-0 z-20 mx-auto flex h-full w-full max-w-[min(100cqw,72cqh)] flex-col items-center px-[5cqmin] pb-[3cqmin] pt-[min(11cqmin,6cqh)]">
        <div className="flex flex-col items-center gap-[0.8cqmin]">
          <JellyWord text="Happy" size="min(17cqmin, 8cqh)" delay={100} />
          <JellyWord text="Birthday!" size="min(15cqmin, 7cqh)" delay={650} offset={2} />
        </div>

        {step >= 2 ? (
          <Reveal anim="pop-in" duration={900} className="relative mt-[3cqmin]">
            <div className="rounded-full p-[1.5cqmin] shadow-[0_1.6cqmin_3cqmin_rgba(190,60,130,0.35)]" style={{ background: 'conic-gradient(from 0deg, #ff6fa5, #ffb23f, #41d6a8, #4dc9ff, #8b7cff, #ff6fa5)' }}>
              <div className="rounded-full bg-white p-[1cqmin]">
                <Avatar className="h-[min(32cqmin,15.5cqh)] w-[min(32cqmin,15.5cqh)]" fallbackClassName="bg-gradient-to-br from-[#ff9ec7] to-[#b79cff]" textClassName="font-fredoka font-bold text-white" />
              </div>
            </div>
            {/* icing drip */}
            <svg viewBox="0 0 100 30" className="absolute -top-[2.4cqmin] left-[-4%] w-[108%]" aria-hidden="true">
              <path d="M2 14 C2 4, 20 0, 50 0 S98 4 98 14 C98 20, 92 20, 92 14 C92 24, 84 24, 84 15 C84 21, 76 21, 76 13 C70 18, 62 16, 60 12 C52 20, 44 18, 42 11 C34 19, 26 17, 24 12 C18 22, 8 20, 8 14 C6 18, 2 18, 2 14 Z" fill="#fff" />
              {[[14, 5, '#ff6fa5'], [30, 3, '#41d6a8'], [48, 5, '#ffb23f'], [66, 3, '#8b7cff'], [82, 5, '#ff6fa5']].map(([x, y, c], i) => (
                <rect key={i} x={x} y={y} width="5" height="1.8" rx="0.9" fill={c} transform={`rotate(${i * 30 - 40} ${x} ${y})`} />
              ))}
            </svg>
            {w.ageText ? (
              <div className="absolute -bottom-[1.4cqmin] -right-[3cqmin] grid h-[11.5cqmin] w-[11.5cqmin] place-items-center rounded-[48%_52%_50%_50%/60%_60%_40%_40%] bg-[#41d6a8] font-fredoka text-[5.4cqmin] font-bold text-white shadow-[0_0.8cqmin_0_#27a883] ring-[0.8cqmin] ring-white">
                {w.ageText}
              </div>
            ) : null}
          </Reveal>
        ) : (
          <div style={{ height: 'min(32cqmin,15.5cqh)', marginTop: '3cqmin' }} />
        )}

        <div className="mt-[3.4cqmin] flex flex-wrap justify-center font-fredoka font-bold leading-none" style={{ fontSize: nameSize }} aria-label={w.name}>
          {step >= 2
            ? [...w.name].map((ch, i) => (
                <span key={i} aria-hidden="true" className="inline-block animate-pop-in" style={{ animationDelay: `${300 + i * 80}ms`, ...jellyStyle(CANDY[(i + 3) % CANDY.length]), animationName: 'popIn' }}>
                  {ch === ' ' ? ' ' : ch}
                </span>
              ))
            : null}
        </div>

        <div className="flex-1" />

        {step >= 3 ? (
          <div className="relative mb-[min(14cqmin,5cqh)] w-full max-w-[92cqmin]">
            <div className="absolute -left-[3.4cqmin] top-1/2 h-[9cqmin] w-[7cqmin] -translate-y-1/2" style={{ background: 'linear-gradient(135deg,#ff6fa5 25%,#fff 25% 50%,#ff6fa5 50% 75%,#fff 75%)', backgroundSize: '3cqmin 3cqmin', clipPath: 'polygon(0 0,100% 18%,100% 82%,0 100%,40% 50%)' }} />
            <div className="absolute -right-[3.4cqmin] top-1/2 h-[9cqmin] w-[7cqmin] -translate-y-1/2" style={{ background: 'linear-gradient(135deg,#ff6fa5 25%,#fff 25% 50%,#ff6fa5 50% 75%,#fff 75%)', backgroundSize: '3cqmin 3cqmin', clipPath: 'polygon(100% 0,0 18%,0 82%,100% 100%,60% 50%)' }} />
            <Reveal anim="pop-in" duration={900} className="relative rounded-[4cqmin] border-[0.9cqmin] border-white bg-[linear-gradient(135deg,#fff7fb,#ffe4f1)] px-[5cqmin] py-[3.6cqmin] text-center shadow-[0_1.4cqmin_0_rgba(214,90,150,0.4)]">
              <p className="font-fredoka text-[clamp(0.85rem,3.6cqmin,1.12rem)] font-medium leading-snug text-[#7a2d5c]">{w.message}</p>
              {w.hasFrom ? <p className="mt-[1.4cqmin] font-fredoka text-[clamp(1rem,4.2cqmin,1.3rem)] font-bold text-[#e0478a]">— {w.from}</p> : null}
              <div className="mt-[2.4cqmin] flex flex-wrap justify-center gap-[1.6cqmin]">
                {w.wishes.map((x, i) => (
                  <span key={i} className="rounded-full px-[3cqmin] py-[1cqmin] font-fredoka text-[clamp(0.65rem,2.6cqmin,0.9rem)] font-semibold text-white shadow-[0_0.5cqmin_0_rgba(0,0,0,0.15)]" style={{ background: CANDY[(i * 2 + 1) % CANDY.length] }}>
                    {x}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>
        ) : null}
      </div>

      {/* tappable candies */}
      <Board ratio={9 / 18.5} className="z-30">
      {step >= 4
        ? ITEMS.map((it, i) => {
            const { C } = it;
            return (
              <button key={i} type="button" onPointerDown={(e) => squish(i, e)} aria-label="Squish the candy" className="absolute z-30 animate-pop-in" style={{ left: `${it.x}%`, top: `${it.y}%`, width: `${it.s}cqw`, height: `${it.s * (C === Lolly ? 2 : 1.1)}cqw`, animationDelay: `${i * 90}ms` }}>
                <div key={squished[i] || 0} className="h-full w-full" style={{ animation: squished[i] ? 'squish 0.6s ease-out' : `bounceSoft 2.6s ease-in-out ${i * 0.3}s infinite` }}>
                  <C {...it.props} />
                </div>
              </button>
            );
          })
        : null}
      </Board>
    </Stage>
  );
}
