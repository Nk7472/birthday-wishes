import Avatar from '../components/shared/Avatar';
import Board from '../components/shared/Board';
import Drift from '../components/shared/Drift';
import { useTimeline } from '../components/shared/hooks';
import Reveal from '../components/shared/Reveal';
import Stage from '../components/shared/Stage';
import Teddy from '../components/shared/Teddy';
import Typewriter from '../components/shared/Typewriter';
import { useWish } from '../components/shared/WishContext';
import { sfx } from '../lib/audio';
import { confetti } from '../lib/confetti';
import { fitName } from '../lib/fit';
import { msgSize } from '../lib/love';
import { useEffect, useState } from 'react';

const sw = (a0, a1, dur, extra) => ({ animation: `tedSwing ${dur}s ease-in-out infinite`, '--a0': a0, '--a1': a1, ...extra });
const WAVE = { head: sw('-5deg', '6deg', 1.8), armL: sw('3deg', '-2deg', 3), armR: sw('-138deg', '-172deg', 0.5) };
const HUG = { head: sw('-3deg', '3deg', 2.2), armL: sw('-120deg', '-132deg', 1.2), armR: sw('120deg', '132deg', 1.2) };

/** The teddy says thank you out loud, waves, then gives a big hug. */
export default function ThanksTeddy() {
  const w = useWish();
  const step = useTimeline([500, 3200, 5200]);
  const [hearts, setHearts] = useState(0);

  useEffect(() => {
    if (step === 1) sfx.pop();
    if (step === 2) sfx.chime(880);
    if (step === 3) {
      sfx.tada();
      setHearts(1);
      confetti.burst({ x: 0.5, y: 0.5, count: 24, spread: 360, power: 0.7, gravity: 0.3, emojis: ['💛', '🧡', '✨'], size: 1.3, ttl: 2.6 });
    }
  }, [step]);

  return (
    <Stage className="bg-[#ffe9c9] text-[#4a2a10]">
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 40%, #fff4de 0%, #ffd9a1 70%, #ffc477 100%)' }} />
      <Drift count={10} seed={12} anim="rise" size={[14, 28]} duration={[8, 14]} delay={[0, 12]} colors={['#ff9aa8']}>
        {() => <span style={{ fontSize: '5cqw' }}>💛</span>}
      </Drift>

      <Board className="pointer-events-none">
        <div className="absolute inset-x-0 top-[4%] flex items-center justify-center gap-[3cqw]">
          <Avatar className="h-[20cqw] w-[20cqw] border-[1cqw] border-white shadow-[0_1.6cqw_4cqw_rgba(90,40,0,0.25)]" fallbackClassName="bg-[#f0a500]" textClassName="font-playfair font-bold text-white" />
          <p className="font-script leading-none text-[#b35a00]" style={{ fontSize: fitName(w.name, 10, { width: 52, factor: 0.5 }) }}>{w.name}</p>
        </div>

        {/* speech bubble */}
        <div className="absolute inset-x-[6%] top-[19%]">
          <div className="relative rounded-[5cqw] bg-white px-[5cqw] py-[4cqw] text-center shadow-[0_2cqw_6cqw_rgba(90,40,0,0.2)]" style={{ minHeight: '36cqw' }}>
            {step < 2 ? (
              <Reveal anim="pop-in" delay={500} className="font-fredoka text-[12.5cqw] font-bold leading-[1.05] text-[#e0600a]">Thank<br />you!</Reveal>
            ) : (
              <div>
                <p className="font-script text-[8.4cqw] leading-tight text-[#b35a00]">Thank you for {w.thanksFor}</p>
                <p className="mt-[1.6cqw] font-hand leading-[1.25] text-[#4a2a10]" style={{ fontSize: `${msgSize(w.message, 5.2, 3.8)}cqw` }}>
                  <Typewriter text={w.message} speed={32} cursor={false} />
                </p>
                {w.hasFrom ? <Reveal delay={3600}><p className="mt-[1.2cqw] font-script text-[7cqw] leading-none text-[#b35a00]">— {w.from}</p></Reveal> : null}
              </div>
            )}
            <span className="absolute -bottom-[3cqw] left-1/2 h-[6cqw] w-[6cqw] -translate-x-1/2 rotate-45 bg-white" />
          </div>
        </div>

        {/* teddy */}
        <div className="absolute inset-x-0 bottom-[3%] flex justify-center">
          <div className="w-[74cqw]" style={{ animation: 'giftBob 2.8s ease-in-out infinite' }}>
            <Teddy face={step >= 3 ? 'kiss' : 'happy'} m={step >= 3 ? HUG : WAVE} />
          </div>
        </div>
        {hearts ? (
          <Reveal anim="pop-in" className="absolute left-1/2 top-[52%] -translate-x-1/2 text-[16cqw]">💛</Reveal>
        ) : null}
      </Board>
    </Stage>
  );
}
