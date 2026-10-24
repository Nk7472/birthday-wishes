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
import { msgSize } from '../lib/love';
import { useEffect, useState } from 'react';

const NOTE_COLORS = ['#ffe28a', '#ffb3c1', '#b8e4ff'];
// where the little hearts rest in the jar: x %, y % of the jar
const HEARTS = [[26, 88], [50, 90], [74, 88], [38, 80], [62, 80], [28, 72], [52, 72], [72, 70], [40, 62], [62, 62], [50, 54]];

/** Thank-you notes drop into a jar of gratitude one by one. Tap to add more hearts. */
export default function ThanksJar() {
  const w = useWish();
  const step = useTimeline([900, 2200, 3500, 5200]); // note 1, note 2, note 3, message
  const [extra, setExtra] = useState(0);
  useEffect(() => {
    if (step >= 1 && step <= 3) sfx.coin();
    if (step === 4) sfx.chime(880);
  }, [step]);
  const add = () => {
    setExtra((v) => v + 1);
    sfx.pop();
    confetti.burst({ x: 0.5, y: 0.55, count: 12, spread: 120, power: 0.5, gravity: 0.3, emojis: ['💛', '🧡'], size: 1.2, ttl: 2 });
  };

  return (
    <Stage className="text-white">
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 38%, #1f5f5b 0%, #123c43 60%, #0b2530 100%)' }} />
      <Drift count={16} seed={6} anim="float" size={[4, 9]} duration={[5, 10]} delay={[0, 8]} colors={['#ffe28a']}>
        {(p) => <span className="block rounded-full" style={{ width: p.size, height: p.size, background: '#ffe28a', boxShadow: '0 0 10px #ffe28a', opacity: 0.8 }} />}
      </Drift>

      <Board className="pointer-events-none">
        <div className="absolute inset-x-0 top-[4%] flex items-center justify-center gap-[3cqw]">
          <Avatar className="h-[18cqw] w-[18cqw] border-[1cqw] border-[#ffe28a]" fallbackClassName="bg-[#f0a500]" textClassName="font-playfair font-bold text-white" />
          <div>
            <p className="font-script leading-none text-[#ffe28a]" style={{ fontSize: fitName(w.name, 10, { width: 54, factor: 0.5 }) }}>{w.name}</p>
            <p className="mt-[1cqw] text-[3.6cqw] font-medium tracking-wide text-white/70">Thank you for {w.thanksFor}</p>
          </div>
        </div>

        {/* notes falling in */}
        {w.wishes.map((t, i) =>
          step > i ? (
            <div key={i} className="absolute left-1/2 z-[3] w-[54cqw]" style={{ top: '14%', marginLeft: `${(i - 1) * 5 - 27}cqw`, animation: 'jarNote 1.5s cubic-bezier(.5,0,.8,.5) both' }}>
              <div className="rounded-[1.6cqw] px-[3cqw] py-[2cqw] text-center font-hand text-[4.6cqw] leading-tight text-[#3d2a0c] shadow-lg" style={{ background: NOTE_COLORS[i], transform: `rotate(${(i - 1) * 6}deg)` }}>{t}</div>
            </div>
          ) : null,
        )}

        {/* the jar */}
        <div className="absolute left-1/2 top-[30%] z-[2] h-[62cqw] w-[56cqw] -translate-x-1/2" style={{ animation: 'giftBob 4s ease-in-out infinite' }}>
          <div className="absolute inset-x-[10%] -top-[3cqw] h-[7cqw] rounded-[2cqw] bg-[#c98f4a]" />
          <div className="absolute inset-x-[4%] top-[3cqw] bottom-0 rounded-[7cqw_7cqw_10cqw_10cqw] border-[0.9cqw] border-white/50 bg-white/[0.12] shadow-[inset_0_0_8cqw_rgba(255,255,255,0.18),0_0_14cqw_rgba(255,226,138,0.35)]">
            <div className="absolute left-[10%] top-[8%] h-[60%] w-[7%] rounded-full bg-white/25" />
            {HEARTS.slice(0, step >= 1 ? HEARTS.length : 0).map(([x, y], i) => (
              <Reveal key={i} anim="pop-in" delay={i * 160} className="absolute -translate-x-1/2 -translate-y-1/2 text-[8cqw] leading-none" style={{ left: `${x}%`, top: `${y}%` }}>
                {i % 3 === 0 ? '💛' : i % 3 === 1 ? '🧡' : '💗'}
              </Reveal>
            ))}
            {Array.from({ length: Math.min(extra, 6) }, (_, i) => (
              <Reveal key={`x${i}`} anim="pop-in" className="absolute -translate-x-1/2 text-[7cqw] leading-none" style={{ left: `${24 + ((i * 17) % 52)}%`, top: `${30 + ((i * 13) % 22)}%` }}>💛</Reveal>
            ))}
            <div className="absolute inset-x-[14%] top-[34%] -rotate-2 rounded-[1.2cqw] bg-[#fff3d0] py-[1.6cqw] text-center font-script text-[7cqw] leading-none text-[#b36b00] shadow">Thank you</div>
          </div>
        </div>

        {step >= 4 ? (
          <div className="absolute inset-x-[7%] top-[79%] text-center">
            <p className="font-hand leading-[1.25] text-white/95" style={{ fontSize: `${msgSize(w.message, 5.6, 4)}cqw` }}>
              <Typewriter text={w.message} speed={34} cursor={false} />
            </p>
            {w.hasFrom ? <Reveal delay={6000}><p className="mt-[1.4cqw] font-script text-[7.6cqw] leading-none text-[#ffe28a]">— {w.from}</p></Reveal> : null}
          </div>
        ) : null}
      </Board>

      <button type="button" aria-label="Add a heart to the jar" onClick={add} className="absolute inset-0 z-[5] cursor-pointer focus:outline-none" tabIndex={-1} />
    </Stage>
  );
}
