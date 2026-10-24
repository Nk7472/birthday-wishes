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
import { fitName } from '../lib/fit';
import { msgSize } from '../lib/love';
import { useEffect } from 'react';

/** A slow golden sunrise; the words arrive with the light. */
export default function ThanksSunrise() {
  const w = useWish();
  const step = useTimeline([300, 2600, 4200]);
  useEffect(() => {
    if (step === 2) sfx.chime(660);
    if (step === 3) sfx.sparkle();
  }, [step]);

  return (
    <Stage className="text-white">
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #2b1b4d 0%, #7a3b69 28%, #f07c4e 62%, #ffc65c 100%)', animation: 'fadeIn 2s ease both' }} />
      <Drift count={14} seed={2} anim="twinkle" size={[2, 5]} duration={[2, 4]} delay={[0, 3]} y={[0, 40]} colors={['#fff']}>
        {(p) => <span className="block rounded-full bg-white" style={{ width: p.size, height: p.size }} />}
      </Drift>

      <Board className="pointer-events-none">
        {/* sun + rays */}
        <div className="absolute left-1/2 top-[63%] h-0 w-0" style={{ animation: 'sunUp 3.4s cubic-bezier(.2,.7,.2,1) 300ms both' }}>
          <div className="absolute left-1/2 top-1/2 h-[150cqw] w-[150cqw] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60" style={{ background: 'repeating-conic-gradient(from 0deg, rgba(255,238,170,0.55) 0deg 6deg, transparent 6deg 18deg)', WebkitMaskImage: 'radial-gradient(circle, #000 12%, transparent 62%)', maskImage: 'radial-gradient(circle, #000 12%, transparent 62%)', animation: 'spinSlow 40s linear infinite' }} />
          <div className="absolute left-1/2 top-1/2 h-[46cqw] w-[46cqw] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: 'radial-gradient(circle, #fffbe0 0%, #ffe27a 55%, #ffb73a 100%)', boxShadow: '0 0 12cqw 6cqw rgba(255,210,90,0.55)' }} />
        </div>
        {/* hills */}
        <div className="absolute inset-x-[-10%] bottom-0 h-[34%]">
          <div className="absolute bottom-0 left-0 h-[85%] w-[70%] rounded-[50%_50%_0_0/100%_100%_0_0] bg-[#8a3d4c]" />
          <div className="absolute bottom-0 right-0 h-[100%] w-[75%] rounded-[50%_50%_0_0/100%_100%_0_0] bg-[#5d2a4a]" />
          <div className="absolute bottom-0 left-[10%] h-[60%] w-[90%] rounded-[50%_50%_0_0/100%_100%_0_0] bg-[#3b1d3f]" />
        </div>

        <div className="absolute inset-x-0 top-[6%] text-center">
          <Reveal anim="pop-in" delay={1400}>
            <Avatar className="mx-auto h-[26cqw] w-[26cqw] border-[1.2cqw] border-white/90 shadow-[0_0_8cqw_rgba(255,220,120,0.7)]" fallbackClassName="bg-[#f0a500]" textClassName="font-playfair font-bold text-white" />
            <p className="mt-[2cqw] font-script leading-none text-[#ffe9a8]" style={{ fontSize: fitName(w.name, 11, { width: 70, factor: 0.48 }) }}>{w.name}</p>
          </Reveal>
        </div>

        <div className="absolute inset-x-[6%] top-[27%] text-center">
          <SplitText text="Thank you" delay={2000} stagger={85} anim="fade-up" className="font-playfair text-[17cqw] font-extrabold leading-none" letterStyle={() => ({ textShadow: '0 1.2cqw 5cqw rgba(60,10,40,0.45)' })} />
          <Reveal delay={3200}>
            <p className="mt-[2cqw] font-script text-[8.6cqw] leading-tight text-[#ffe9a8]" style={{ textShadow: '0 0.6cqw 3cqw rgba(60,10,40,0.5)' }}>for {w.thanksFor}</p>
          </Reveal>
        </div>

        <div className="absolute inset-x-[7%] top-[47%] text-center" style={{ textShadow: '0 0.6cqw 3cqw rgba(40,5,30,0.6)' }}>
          <p className="font-hand leading-[1.3]" style={{ fontSize: `${msgSize(w.message, 6.2, 4.2)}cqw` }}>
            <Typewriter text={w.message} speed={36} delay={4300} cursor={false} />
          </p>
          {w.hasFrom ? (
            <Reveal delay={9500}>
              <p className="mt-[3cqw] font-script text-[8.6cqw] leading-none text-[#ffe9a8]">With gratitude, {w.from}</p>
            </Reveal>
          ) : null}
        </div>
      </Board>
    </Stage>
  );
}
