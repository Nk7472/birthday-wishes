import { useState } from 'react';
import Avatar from '../components/shared/Avatar';
import Board from '../components/shared/Board';
import Drift from '../components/shared/Drift';
import Reveal from '../components/shared/Reveal';
import SplitText from '../components/shared/SplitText';
import Stage from '../components/shared/Stage';
import Typewriter from '../components/shared/Typewriter';
import { useWish } from '../components/shared/WishContext';
import { sfx } from '../lib/audio';
import { confetti } from '../lib/confetti';
import { fitName } from '../lib/fit';
import { msgSize } from '../lib/love';

// flower, x %, final y %, size (cqw), tilt, delay (ms)
const FLOWERS = [
  ['🌻', 50, 44, 30, 0, 700],
  ['🌷', 30, 49, 25, -14, 1000],
  ['🌹', 70, 49, 25, 14, 1250],
  ['🌸', 18, 56, 21, -26, 1500],
  ['🌼', 82, 56, 21, 26, 1700],
  ['🌺', 40, 55, 22, -6, 1900],
  ['💐', 60, 55, 22, 7, 2100],
];

/** Flowers grow into a bouquet for the person. Tap for a shower of petals. */
export default function ThanksBouquet() {
  const w = useWish();
  const [n, setN] = useState(0);
  const shower = () => {
    setN((v) => v + 1);
    sfx.sparkle();
    confetti.burst({ x: 0.5, y: 0.5, count: 20, spread: 360, power: 0.7, gravity: 0.35, emojis: ['🌸', '🌼', '💛', '🌷'], size: 1.3, ttl: 2.6 });
  };

  return (
    <Stage className="bg-[#ffe3e8] text-[#5a2434]">
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #fff1f3 0%, #ffd3dc 55%, #ffbfcc 100%)' }} />
      <Drift count={10} seed={4} anim="float" size={[14, 26]} duration={[6, 10]} delay={[0, 8]} colors={['#ffb3c1']}>
        {() => <span className="text-[1em]" style={{ fontSize: '4cqw' }}>✨</span>}
      </Drift>

      <Board className="pointer-events-none">
        <div className="absolute inset-x-0 top-[5%] text-center">
          <Avatar className="mx-auto h-[26cqw] w-[26cqw] border-[1.2cqw] border-white shadow-[0_2cqw_5cqw_rgba(120,30,60,0.25)]" fallbackClassName="bg-[#e46a8b]" textClassName="font-playfair font-bold text-white" />
          <p className="mt-[2cqw] font-script leading-none text-[#b3244f]" style={{ fontSize: fitName(`For ${w.name}`, 11, { width: 70, factor: 0.46 }) }}>For {w.name}</p>
        </div>

        <div className="absolute inset-x-0 top-[26%] text-center">
          <SplitText text="Thank you" delay={200} stagger={70} anim="pop-in" className="font-playfair text-[15cqw] font-extrabold leading-none text-[#8e1d44]" />
          <Reveal delay={1100}>
            <p className="mt-[1.4cqw] font-script text-[7.6cqw] leading-tight text-[#b3244f]">for {w.thanksFor}</p>
          </Reveal>
        </div>

        {/* the bouquet */}
        <div className="absolute inset-0" key={n}>
          {FLOWERS.map(([e, x, y, s, r, d], i) => (
            <span key={i} className="absolute block leading-none" style={{ left: `${x}%`, top: `${y}%`, fontSize: `${s}cqw`, transform: `translate(-50%, -50%) rotate(${r}deg)` }}>
              <span className="block" style={{ animation: `bloom 1s var(--ease-out) ${n ? d / 4 : d}ms both` }}>
                <span className="block" style={{ animation: `sway ${3 + (i % 3)}s ease-in-out ${i * 0.3}s infinite` }}>{e}</span>
              </span>
            </span>
          ))}
          <div className="absolute left-1/2 top-[61%] h-[17cqw] w-[28cqw] -translate-x-1/2 rounded-b-[6cqw] bg-[#f4b942]" style={{ clipPath: 'polygon(0 0, 100% 0, 80% 100%, 20% 100%)' }} />
          <div className="absolute left-1/2 top-[66.5%] -translate-x-1/2 rounded-full bg-[#c4163f] px-[4cqw] py-[1.2cqw] text-[3.4cqw] font-bold tracking-wide text-white shadow">THANK YOU</div>
        </div>

        <div className="absolute inset-x-[6%] top-[73%] rounded-[3cqw] bg-white/80 px-[5cqw] py-[3.4cqw] text-center shadow-[0_2cqw_6cqw_rgba(120,30,60,0.15)]" style={{ transform: 'translateY(0)' }}>
          <p className="font-hand leading-[1.25] text-[#5a2434]" style={{ fontSize: `${msgSize(w.message, 5.2, 3.8)}cqw` }}>
            <Typewriter text={w.message} speed={34} delay={2800} cursor={false} />
          </p>
          {w.hasFrom ? <p className="mt-[1cqw] font-script text-[7cqw] leading-none text-[#b3244f]">— {w.from}</p> : null}
        </div>
      </Board>

      <button type="button" aria-label="Shower of petals" onClick={shower} className="absolute inset-0 z-[5] cursor-pointer focus:outline-none" tabIndex={-1} />
    </Stage>
  );
}
