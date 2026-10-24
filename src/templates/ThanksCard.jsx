import { useEffect, useState } from 'react';
import Avatar from '../components/shared/Avatar';
import Board from '../components/shared/Board';
import Drift from '../components/shared/Drift';
import Reveal from '../components/shared/Reveal';
import Stage from '../components/shared/Stage';
import Typewriter from '../components/shared/Typewriter';
import { useWish } from '../components/shared/WishContext';
import { sfx } from '../lib/audio';
import { confetti } from '../lib/confetti';
import { fitName } from '../lib/fit';
import { msgSize } from '../lib/love';

/** A greeting card on a table: tap and the cover swings open. */
export default function ThanksCard() {
  const w = useWish();
  const [open, setOpen] = useState(false);

  const openIt = () => {
    if (open) return;
    setOpen(true);
    sfx.whoosh();
    setTimeout(() => {
      sfx.chime(784);
      confetti.burst({ x: 0.5, y: 0.45, count: 22, spread: 360, power: 0.6, gravity: 0.25, emojis: ['💛', '🌼', '✨'], size: 1.3, ttl: 2.6 });
    }, 650);
  };
  useEffect(() => {
    const t = setTimeout(openIt, 5500); // never wait on a tap forever
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Stage className="bg-[#f6e7c8] text-[#4a3217]">
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 35%, #fff6df 0%, #f6e0b4 60%, #e8c88c 100%)' }} />
      <Drift count={12} seed={9} anim="fall" size={[12, 24]} duration={[12, 22]} delay={[0, 18]} sway colors={['#f6b93b', '#f8c291', '#f7d794']}>
        {(p) => <span className="block h-[1.2em] w-[1em] rounded-[60%_0_60%_0] opacity-70" style={{ background: p.color, fontSize: p.size }} />}
      </Drift>

      <Board className="pointer-events-none">
        <div className="absolute left-[7%] top-[10%] h-[80%] w-[86%]">
          {/* inside page */}
          <div className="absolute inset-0 overflow-hidden rounded-[3cqw] bg-[#fffaf0] px-[6cqw] pb-[5cqw] pt-[6cqw] shadow-[0_3cqw_9cqw_rgba(90,60,10,0.3)]">
            {open ? (
              <>
                <div className="flex items-center gap-[4cqw]">
                  <Avatar className="h-[22cqw] w-[22cqw] border-[1cqw] border-[#f6c453]" fallbackClassName="bg-[#f0a500]" textClassName="font-playfair font-bold text-white" />
                  <p className="min-w-0 font-script leading-[1.05] text-[#b36b00]" style={{ fontSize: fitName(`Dear ${w.name},`, 10, { width: 52, factor: 0.46 }) }}>Dear {w.name},</p>
                </div>
                <Reveal delay={500} className="mt-[3cqw]">
                  <p className="font-playfair text-[13cqw] font-extrabold leading-[1] tracking-[-0.02em] text-[#3d2a0c]">Thank you</p>
                  <p className="mt-[1cqw] font-script text-[7.6cqw] leading-tight text-[#b36b00]">for {w.thanksFor}</p>
                </Reveal>
                <p className="mt-[4cqw] font-hand leading-[1.3] text-[#4a3217]" style={{ fontSize: `${msgSize(w.message, 6.4, 4.4)}cqw` }}>
                  <Typewriter text={w.message} speed={34} delay={1100} cursor={false} />
                </p>
                <Reveal delay={4200} className="mt-[3cqw] space-y-[1.2cqw]">
                  {w.wishes.map((t, i) => (
                    <p key={i} className="font-hand text-[4.6cqw] leading-[1.3] text-[#7a5520]">💛 {t}</p>
                  ))}
                </Reveal>
                {w.hasFrom ? (
                  <Reveal delay={5200}>
                    <p className="mt-[3cqw] text-right font-script text-[8cqw] leading-none text-[#b36b00]">With love, {w.from}</p>
                  </Reveal>
                ) : null}
              </>
            ) : null}
          </div>

          {/* the cover swings open towards the left edge. The bobbing and the opening live on two different
              elements: one element must never switch from one keyframe animation to another (the video export
              would keep the frozen old one). */}
          <div className="absolute inset-0" style={{ animation: open ? 'none' : 'giftBob 3.4s ease-in-out infinite' }}>
            <div
              className="absolute inset-0 origin-left overflow-hidden rounded-[3cqw] bg-[#f0b429] shadow-[0_3cqw_9cqw_rgba(90,60,10,0.35)]"
              style={{ animation: open ? 'coverOpen 0.9s var(--ease-out) both' : 'none' }}
            >
              <div className="absolute inset-[4cqw] rounded-[2cqw] border-[0.8cqw] border-dashed border-white/70" />
              <div className="absolute inset-x-0 top-[12%] text-center text-[26cqw] leading-none">🌻</div>
              <p className="absolute inset-x-0 top-[44%] text-center font-script text-[19cqw] leading-[0.95] text-white" style={{ textShadow: '0 1cqw 0 rgba(150,90,0,0.35)' }}>
                Thank<br />you
              </p>
              <p className="absolute inset-x-0 bottom-[11%] text-center text-[3.8cqw] font-semibold tracking-[0.2em] text-white/90">TAP TO OPEN</p>
            </div>
          </div>
        </div>
      </Board>

      <button type="button" aria-label="Open the card" onClick={openIt} className="absolute inset-0 z-[5] cursor-pointer focus:outline-none" tabIndex={-1} />
    </Stage>
  );
}
