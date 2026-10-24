import { useEffect, useState } from 'react';
import Avatar from '../components/shared/Avatar';
import Balloon from '../components/shared/Balloon';
import Cake from '../components/shared/Cake';
import Drift from '../components/shared/Drift';
import { useTimeline } from '../components/shared/hooks';
import Reveal from '../components/shared/Reveal';
import Stage from '../components/shared/Stage';
import { useWish } from '../components/shared/WishContext';
import { confetti } from '../lib/confetti';
import { sfx } from '../lib/audio';

const BALLOON_COLORS = ['#ff4d8d', '#ffc83d', '#3ddcb4', '#8b7cff', '#4dc9ff', '#ff8a3d'];
const HAPPY = 'HAPPY'.split('');
const BDAY = 'BIRTHDAY'.split('');

function Bunting() {
  const flags = Array.from({ length: 11 });
  return (
    <svg viewBox="0 0 400 60" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[9cqmin] w-full animate-fade-in" aria-hidden="true">
      <path d="M-5 6 Q200 44 405 6" fill="none" stroke="#fff" strokeOpacity="0.8" strokeWidth="1.6" />
      {flags.map((_, i) => {
        const x = 8 + i * 38;
        const y = 6 + Math.sin((i / 10) * Math.PI) * 17;
        return <path key={i} d={`M${x} ${y} L${x + 24} ${y + 2} L${x + 12} ${y + 28} Z`} fill={BALLOON_COLORS[i % BALLOON_COLORS.length]} />;
      })}
    </svg>
  );
}

function LetterRow({ letters, start, size, colorShift = 0 }) {
  return (
    <div className="flex justify-center" style={{ gap: '0.6cqmin' }}>
      {letters.map((ch, i) => (
        <Reveal key={i} anim="drop-in" delay={start + i * 110} style={{ width: `${size}cqmin` }}>
          <div className="animate-sway" style={{ animationDelay: `${i * 0.25}s`, transformOrigin: '50% 0%' }}>
            <Balloon color={BALLOON_COLORS[(i + colorShift) % BALLOON_COLORS.length]} label={ch} className="w-full" />
          </div>
        </Reveal>
      ))}
    </div>
  );
}

export default function BalloonBash() {
  const w = useWish();
  const step = useTimeline([0, 500, 2000, 3600, 5600]);
  const [lit, setLit] = useState(true);

  useEffect(() => {
    if (step === 2) sfx.whoosh();
    if (step === 3) {
      sfx.tada();
      confetti.cannons();
    }
    if (step === 5) sfx.sparkle();
  }, [step]);

  const blow = () => {
    if (step < 4) return;
    const next = !lit;
    setLit(next);
    if (!next) {
      sfx.blow();
      confetti.stars();
      confetti.emoji(['🎉', '🎈', '✨', '🎂']);
      sfx.sparkle();
    } else {
      sfx.chime(988);
    }
  };

  return (
    <Stage className="bg-gradient-to-b from-[#ffd6e7] via-[#ffe3d1] to-[#d8cbff]">
      {/* soft sun glow + clouds */}
      <div className="absolute left-1/2 top-[18%] h-[90cqmin] w-[90cqmin] -translate-x-1/2 rounded-full bg-white/50 blur-3xl" />
      <Drift count={5} seed={4} anim="float-slow" size={[90, 180]} duration={[9, 14]} y={[8, 70]} x={[-10, 85]}>
        {(p) => <div className="h-[0.55em] rounded-full bg-white/55 blur-[2px]" style={{ fontSize: p.size }} />}
      </Drift>

      {/* balloons rising behind everything */}
      <Drift count={12} seed={11} anim="rise" sway size={[46, 92]} duration={[13, 22]} delay={[0, 18]} className="opacity-90">
        {(p) => <Balloon color={p.color} className="w-full" />}
      </Drift>

      <Bunting />

      <div className="relative z-20 mx-auto flex h-full w-full max-w-[min(100cqw,74cqh)] flex-col items-center justify-between px-[4cqmin] pb-[15cqmin] pt-[11cqmin]">
        {/* HAPPY / BIRTHDAY balloon letters */}
        <div className="flex w-full flex-col items-center" style={{ gap: '1cqmin' }}>
          {step >= 2 ? <LetterRow letters={HAPPY} start={0} size={13.5} /> : <div style={{ height: '17cqmin' }} />}
          {step >= 2 ? <LetterRow letters={BDAY} start={650} size={10.8} colorShift={3} /> : <div style={{ height: '14cqmin' }} />}
        </div>

        {/* birthday person */}
        {step >= 3 ? (
          <div className="flex flex-col items-center">
            <Reveal anim="pop-in" className="relative">
              <div className="absolute -inset-[1.6cqmin] animate-spin-slow rounded-full bg-[conic-gradient(from_0deg,#ff4d8d,#ffc83d,#3ddcb4,#8b7cff,#ff4d8d)] opacity-90" />
              <Avatar className="relative h-[27cqmin] w-[27cqmin] border-[1cqmin] border-white shadow-xl" />
              {w.ageText ? (
                <span className="absolute -bottom-[1cqmin] -right-[2cqmin] grid h-[10cqmin] w-[10cqmin] place-items-center rounded-full bg-[#ff4d8d] text-[4.6cqmin] font-extrabold text-white shadow-lg ring-[0.8cqmin] ring-white">
                  {w.ageText}
                </span>
              ) : null}
            </Reveal>
            <Reveal anim="fade-up" delay={250} className="mt-[2.6cqmin] text-center">
              <p className="font-pacifico text-[clamp(2rem,9.5cqmin,4.5rem)] leading-none text-[#e0246f] drop-shadow-[0_2px_0_rgba(255,255,255,0.8)]">
                {w.name}
              </p>
            </Reveal>
          </div>
        ) : (
          <div />
        )}

        {/* cake + message */}
        <div className="flex w-full flex-col items-center" style={{ gap: '2.4cqmin' }}>
          {step >= 3 ? (
            <Reveal anim="drop-in" delay={150} className="relative w-[40cqmin] min-w-[130px]">
              <button type="button" onClick={blow} className="block w-full cursor-pointer focus:outline-none" aria-label="Blow out the candles">
                <Cake className="w-full drop-shadow-[0_14px_16px_rgba(120,40,90,0.28)]" tiers={2} candles={5} lit={lit} />
              </button>
              {step >= 5 ? (
                <p className="mt-[1.4cqmin] animate-pulse text-center text-[clamp(0.7rem,2.9cqmin,1rem)] font-semibold text-[#8a3a6c]">
                  {lit ? 'Tap the cake to blow the candles' : 'Make a wish!'}
                </p>
              ) : null}
            </Reveal>
          ) : null}
          {step >= 5 ? (
            <Reveal anim="fade-up" className="w-full max-w-[92cqmin] rounded-[3cqmin] bg-white/92 px-[4.5cqmin] py-[3.4cqmin] text-center shadow-xl shadow-pink-300/40">
              <p className="text-[clamp(0.85rem,3.5cqmin,1.35rem)] font-medium leading-snug text-[#5b2a54]">{w.message}</p>
              {w.hasFrom ? <p className="mt-[1.6cqmin] font-script text-[clamp(1.1rem,4.6cqmin,1.9rem)] font-bold text-[#e0246f]">With love, {w.from}</p> : null}
            </Reveal>
          ) : null}

        </div>
      </div>
    </Stage>
  );
}
