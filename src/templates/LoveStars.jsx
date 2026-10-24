import { useEffect, useMemo, useState } from 'react';
import Avatar from '../components/shared/Avatar';
import Board from '../components/shared/Board';
import Drift from '../components/shared/Drift';
import { useTimeline } from '../components/shared/hooks';
import Reveal from '../components/shared/Reveal';
import Stage from '../components/shared/Stage';
import Typewriter from '../components/shared/Typewriter';
import { useWish } from '../components/shared/WishContext';
import { sfx } from '../lib/audio';
import { confetti } from '../lib/confetti';
import { fitName } from '../lib/fit';
import { heartPoints, msgSize, togetherText } from '../lib/love';

const STAR = 'polygon(50% 0%, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0% 50%, 39% 39%)';

export default function LoveStars() {
  const w = useWish();
  const step = useTimeline([300, 4200, 7000, 10500]);
  const [shots, setShots] = useState([]);
  const together = togetherText(w);

  // the heart constellation: 20 stars, drawn in order, joined by thin lines (heart is 62cqw wide, centred)
  const pts = useMemo(() => {
    const raw = heartPoints(20);
    return raw.map((p) => ({ x: 19 + p.x * 62, y: 32 + p.y * 58 })); // cqw (board width units)
  }, []);
  const lines = useMemo(
    () =>
      pts.map((p, i) => {
        const q = pts[(i + 1) % pts.length];
        const dx = q.x - p.x;
        const dy = q.y - p.y;
        return { x: p.x, y: p.y, len: Math.hypot(dx, dy), ang: (Math.atan2(dy, dx) * 180) / Math.PI };
      }),
    [pts],
  );

  useEffect(() => {
    if (step === 1) sfx.whoosh();
    if (step === 2) {
      sfx.chime(1175);
      confetti.burst({ x: 0.5, y: 0.36, count: 40, spread: 360, power: 0.7, gravity: 0.1, shapes: ['star'], colors: ['#fff3b0', '#ffd1e6', '#ffffff'], ttl: 2.4 });
    }
    if (step === 3) sfx.sparkle();
  }, [step]);

  const shoot = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    setShots((s) => [...s.slice(-5), { id: Math.random(), x, y }]);
    confetti.burst({ x: x / 100, y: y / 100, count: 14, spread: 360, power: 0.4, gravity: 0, shapes: ['star'], colors: ['#fff3b0', '#ffd1e6'], ttl: 1.4, size: 0.8 });
    sfx.sparkle();
  };

  const names = w.hasFrom ? `${w.from} & ${w.name}` : w.name;

  return (
    <Stage className="bg-[#070a1f] text-white">
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 100%, #3a1f5c 0%, #141538 45%, #070a1f 100%)' }} />
      <Drift count={70} seed={4} anim="twinkle" size={[1.5, 4]} duration={[2, 6]} colors={['#ffffff', '#ffe9f2', '#cfe0ff']}>
        {(p) => <span className="block h-full w-full rounded-full" style={{ background: p.color }} />}
      </Drift>

      <Board className="pointer-events-none">
        {/* two stars drift together */}
        <span className="absolute left-0 top-[28%] h-[7cqw] w-[7cqw] bg-[#ffd1e6]" style={{ clipPath: STAR, animation: 'starFlyL 4s var(--ease-out) both', boxShadow: '0 0 4cqw #ff8fb8', opacity: step >= 1 && step < 2 ? 1 : 0, '--to': '46cqw', transition: 'opacity .4s' }} />
        <span className="absolute right-0 top-[28%] h-[7cqw] w-[7cqw] bg-[#cfe0ff]" style={{ clipPath: STAR, animation: 'starFlyR 4s var(--ease-out) both', boxShadow: '0 0 4cqw #8fb8ff', opacity: step >= 1 && step < 2 ? 1 : 0, '--to': '-46cqw', transition: 'opacity .4s' }} />

        {/* constellation lines */}
        {step >= 2
          ? lines.map((l, i) => (
              <span key={`l${i}`} className="absolute h-[0.35cqw] origin-left bg-[#ffd9ea]" style={{ left: `${l.x}cqw`, top: `${l.y}cqw`, width: `${l.len}cqw`, '--r': `${l.ang}deg`, animation: `lineIn 0.6s ease ${0.2 + i * 0.12}s both`, transform: `rotate(${l.ang}deg)` }} />
            ))
          : null}
        {step >= 2
          ? pts.map((p, i) => (
              <span key={`s${i}`} className="absolute h-[4.4cqw] w-[4.4cqw] bg-white" style={{ left: `${p.x}cqw`, top: `${p.y}cqw`, clipPath: STAR, animation: `starIn 0.7s ease ${i * 0.12}s both`, boxShadow: '0 0 3cqw #ffc3dd' }} />
            ))
          : null}

        {step >= 2 ? (
          <Reveal anim="zoom-in" delay={900} className="absolute left-1/2 top-[46cqw] -translate-x-1/2">
            <Avatar className="h-[30cqw] w-[30cqw] border-[0.9cqw] border-[#ffd9ea]" fallbackClassName="bg-[#4a2d8a]" textClassName="font-cinzel font-bold text-white" style={{ boxShadow: '0 0 8cqw rgba(255,160,200,0.6)' }} />
          </Reveal>
        ) : null}

        {step >= 3 ? (
          <>
            <Reveal className="absolute inset-x-[4cqw] top-[4.5%] text-center">
              <p className="font-cinzel leading-tight tracking-[0.08em] text-[#fff1f7]" style={{ fontSize: fitName(names, 9, { factor: 0.78, width: 84 }) }}>{names}</p>
            </Reveal>
            <Reveal delay={600} className="absolute inset-x-[4cqw] top-[55%] text-center">
              <p className="font-script text-[8cqw] leading-none text-[#ffb3d1]">{together || 'written in the stars'}</p>
            </Reveal>
          </>
        ) : null}

        {step >= 4 ? (
          <Reveal className="absolute inset-x-[7cqw] top-[65%]">
            <div className="rounded-[4cqw] border border-white/15 bg-[#10113a]/90 px-[5cqw] py-[3cqw] text-center">
              <p className="font-playfair italic leading-[1.35] text-[#f3eaff]" style={{ fontSize: `${msgSize(w.message, 4.3, 3.2)}cqw` }}>
                <Typewriter text={w.message} speed={28} cursor={false} />
              </p>
            </div>
          </Reveal>
        ) : null}
        {step >= 4 ? (
          <div className="absolute inset-x-0 bottom-[1.6%] px-[5cqw] text-center">
            <Reveal delay={2000}><p className="font-hand text-[3.8cqw] text-[#ffc6dc]">{w.wishes.join('  ✦  ')}</p></Reveal>
          </div>
        ) : null}
      </Board>

      {/* shooting stars from taps */}
      {shots.map((s) => (
        <span key={s.id} className="pointer-events-none absolute h-[0.5cqmin] w-[22cqmin] origin-left rounded-full" style={{ left: `${s.x}%`, top: `${s.y}%`, '--r': '28deg', '--dx': '60cqmin', '--dy': '34cqmin', background: 'linear-gradient(90deg, #fff, rgba(255,255,255,0))', animation: 'shoot 1.1s ease-out both' }} onAnimationEnd={() => setShots((q) => q.filter((z) => z.id !== s.id))} />
      ))}
      <div className="absolute inset-0" onPointerDown={shoot} />
    </Stage>
  );
}
