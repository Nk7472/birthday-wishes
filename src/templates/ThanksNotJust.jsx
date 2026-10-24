import Avatar from '../components/shared/Avatar';
import Board from '../components/shared/Board';
import { useTimeline } from '../components/shared/hooks';
import Reveal from '../components/shared/Reveal';
import Stage from '../components/shared/Stage';
import Typewriter from '../components/shared/Typewriter';
import { useWish } from '../components/shared/WishContext';
import { sfx } from '../lib/audio';
import { confetti } from '../lib/confetti';
import { msgSize } from '../lib/love';
import { useEffect } from 'react';

/** The little "thanks 👍" everybody sends... and then the real thank you arrives. */
export default function ThanksNotJust() {
  const w = useWish();
  const step = useTimeline([500, 2200, 3600, 4700]);
  useEffect(() => {
    if (step === 1) sfx.pop();
    if (step === 2) sfx.whoosh();
    if (step === 3) {
      sfx.tada();
      confetti.burst({ x: 0.5, y: 0.4, count: 40, spread: 360, power: 0.9, gravity: 0.5, emojis: ['❤️', '💛', '✨', '🎉'], size: 1.3, ttl: 2.8 });
    }
  }, [step]);

  return (
    <Stage className="bg-[#eef1f6] text-[#14213d]">
      {step >= 3 ? <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,#fff3d6,#ffd6e0)', animation: 'fadeIn 0.8s ease both' }} /> : null}
      <Board className="pointer-events-none">
        {/* chat header */}
        <div className="absolute inset-x-0 top-0 flex items-center gap-[3cqw] bg-white/80 px-[5cqw] pb-[3cqw] pt-[6cqw] shadow-sm">
          <Avatar className="h-[11cqw] w-[11cqw]" fallbackClassName="bg-[#8e8e93]" textClassName="font-ui font-bold text-white" />
          <div>
            <p className="font-ui text-[4.4cqw] font-semibold leading-none">{w.name}</p>
            <p className="mt-[0.8cqw] font-ui text-[3cqw] text-[#34c759]">online</p>
          </div>
        </div>

        {/* what everybody sends */}
        {step >= 1 && step < 3 ? (
          <div className="absolute right-[6%] top-[14%] max-w-[70%]">
            <Reveal anim="pop-in">
              <div className="relative rounded-[5cqw] rounded-br-[1.4cqw] bg-[#0b84ff] px-[5cqw] py-[3cqw] text-[6cqw] font-medium text-white shadow">
                <span className={step >= 2 ? 'line-through decoration-[0.7cqw]' : ''}>thanks 👍</span>
              </div>
            </Reveal>
            {step >= 2 ? <Reveal delay={150}><p className="mt-[2cqw] text-right font-hand text-[5.4cqw] text-[#8a8f9c]">...that's it? 😅</p></Reveal> : null}
          </div>
        ) : null}

        {/* the real one */}
        {step >= 3 ? (
          <div className="absolute inset-x-[5%] top-[22%]">
            <Reveal anim="pop-in">
              <div className="rounded-[7cqw] rounded-br-[2cqw] bg-gradient-to-br from-[#ff6b8b] to-[#ff9f43] px-[6cqw] py-[6cqw] text-white shadow-[0_3cqw_9cqw_rgba(255,107,139,0.4)]">
                <p className="font-playfair text-[13cqw] font-extrabold leading-[1]">Thank you</p>
                <p className="mt-[1.4cqw] font-script text-[9cqw] leading-tight">so much for {w.thanksFor} ❤️</p>
              </div>
            </Reveal>
            <Reveal delay={900}>
              <div className="mt-[4cqw] rounded-[5cqw] rounded-tl-[1.4cqw] bg-white px-[5cqw] py-[4cqw] shadow-[0_2cqw_6cqw_rgba(20,33,61,0.12)]">
                <p className="font-hand leading-[1.3]" style={{ fontSize: `${msgSize(w.message, 6, 4.2)}cqw` }}>
                  <Typewriter text={w.message} speed={34} delay={900} cursor={false} />
                </p>
                {w.hasFrom ? <Reveal delay={7200}><p className="mt-[2cqw] font-script text-[8cqw] leading-none text-[#e0476b]">— {w.from}</p></Reveal> : null}
              </div>
            </Reveal>
            <Reveal delay={1800}>
              <div className="mt-[4cqw] space-y-[1.6cqw]">
                {w.wishes.map((t, i) => (
                  <div key={i} className="w-fit max-w-[88%] rounded-[4cqw] bg-white/90 px-[4cqw] py-[2cqw] font-hand text-[4.8cqw] text-[#5a4a5e] shadow-sm">{t}</div>
                ))}
              </div>
            </Reveal>
          </div>
        ) : null}
        <p className="absolute inset-x-0 bottom-[3%] text-center font-ui text-[3cqw] tracking-wide text-[#8a8f9c]" style={{ opacity: step >= 3 ? 0 : 1 }}>
          Typing…
        </p>
      </Board>
    </Stage>
  );
}
