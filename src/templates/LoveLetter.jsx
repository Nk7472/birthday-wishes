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
import { msgSize, togetherText } from '../lib/love';

export default function LoveLetter() {
  const w = useWish();
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState(false);
  const together = togetherText(w);

  const openIt = () => {
    if (open) return;
    setOpen(true);
    sfx.pop();
    confetti.burst({ x: 0.5, y: 0.5, count: 18, spread: 360, power: 0.5, gravity: 0.2, emojis: ['💗', '💌', '✨'], size: 1.3, ttl: 2.4 });
  };

  // never wait on a tap forever
  useEffect(() => {
    const t = setTimeout(openIt, 6500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!open) return undefined;
    const a = setTimeout(() => sfx.whoosh(), 700);
    const b = setTimeout(() => setRead(true), 2100);
    const c = setTimeout(() => sfx.chime(880), 2100);
    return () => [a, b, c].forEach(clearTimeout);
  }, [open]);

  return (
    <Stage className="bg-[#fde8ec] text-[#4a1d2b]">
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 30%, #fff5f6 0%, #fbd3dc 55%, #f2a7ba 100%)' }} />
      <Drift count={14} seed={5} anim="fall" size={[12, 26]} duration={[12, 22]} delay={[0, 18]} sway colors={['#ff8fab', '#ffb3c6', '#ff6f91']}>
        {(p) => <span className="block h-[1.25em] w-[1em] rounded-[60%_0_60%_0] opacity-70" style={{ background: p.color, fontSize: p.size }} />}
      </Drift>

      <Board className="pointer-events-none">
        {/* the letter */}
        <div
          className="absolute left-[8%] top-[17%] z-[2] w-[84%]"
          style={{ transformOrigin: '50% 100%', animation: open ? 'letterOut 1.7s var(--ease-out) 0.7s both' : 'none', opacity: open ? 1 : 0, willChange: 'transform' }}
        >
          <div className="rounded-[2.4cqw] bg-[#fffaf0] px-[6cqw] pb-[7cqw] pt-[6cqw] shadow-[0_3cqw_8cqw_rgba(120,30,60,0.28)]" style={{ minHeight: '88cqw', backgroundImage: 'repeating-linear-gradient(transparent 0 6.2cqw, rgba(200,120,140,0.16) 6.2cqw 6.4cqw)' }}>
            {read ? (
              <>
                <div className="flex items-center gap-[3.4cqw]">
                  <Avatar className="h-[16cqw] w-[16cqw] border-[0.8cqw] border-[#f4b6c4]" fallbackClassName="bg-[#e46a8b]" textClassName="font-playfair font-bold text-white" />
                  <div className="min-w-0">
                    <p className="font-script leading-[1.05] text-[#b3244f]" style={{ fontSize: fitName(`My dearest ${w.name},`, 9, { width: 60, factor: 0.46 }) }}>My dearest {w.name},</p>
                    {together ? <p className="mt-[1cqw] font-hand text-[4.2cqw] text-[#b3244f]/80">{together}</p> : null}
                  </div>
                </div>
                <p className="mt-[4cqw] font-hand leading-[1.32] text-[#4a1d2b]" style={{ fontSize: `${msgSize(w.message, 6.2, 4.4)}cqw` }}>
                  <Typewriter text={w.message} speed={34} cursor={false} />
                </p>
                {w.hasFrom ? (
                  <Reveal delay={3200}>
                    <p className="mt-[3cqw] text-right font-script text-[8cqw] leading-none text-[#b3244f]">Forever yours, {w.from} ♥</p>
                  </Reveal>
                ) : null}
                <Reveal delay={4200} className="mt-[3cqw]">
                  {w.wishes.map((t, i) => (
                    <p key={i} className="font-hand text-[4.4cqw] leading-[1.35] text-[#7a3047]">P.S. {t}</p>
                  ))}
                </Reveal>
              </>
            ) : null}
          </div>
        </div>

        {/* envelope */}
        <div className="absolute left-[10%] top-[38%] z-[3] w-[80%]" style={{ perspective: '160cqw', animation: open ? 'none' : 'giftBob 3.4s ease-in-out infinite', transition: 'transform 1.2s var(--ease-out), opacity 0.8s ease 1.6s', transform: open ? 'translateY(52cqw) scale(0.94)' : 'none', opacity: open ? 0.0 : 1 }}>
          <div className="relative aspect-[10/6.6] w-full rounded-[2cqw] bg-[#f6c5d1] shadow-[0_3cqw_7cqw_rgba(120,30,60,0.35)]">
            <div className="absolute inset-0 overflow-hidden rounded-[2cqw]">
              <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, transparent 49.5%, #e8a0b2 50%) 0 0 / 50.5% 100% no-repeat, linear-gradient(225deg, transparent 49.5%, #e8a0b2 50%) 100% 0 / 50.5% 100% no-repeat' }} />
              <div className="absolute inset-x-0 bottom-0 h-[62%]" style={{ background: '#f9d4de', clipPath: 'polygon(0 100%, 50% 0, 100% 100%)' }} />
            </div>
            <div
              className="absolute inset-x-0 top-0 h-[62%] origin-top"
              style={{ transformStyle: 'preserve-3d', animation: open ? 'flapOpen 0.7s var(--ease-out) both' : 'none', zIndex: open ? 0 : 2 }}
            >
              <div className="absolute inset-0 rounded-t-[2cqw] bg-[#e9a2b5]" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)', backfaceVisibility: 'hidden' }} />
              <div className="absolute inset-0 bg-[#f7cbd6]" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)', transform: 'rotateX(180deg)', backfaceVisibility: 'hidden' }} />
            </div>
            <div className="absolute left-1/2 top-[56%] z-[3] grid h-[15cqw] w-[15cqw] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#c4163f] text-[7.4cqw] text-[#ffd1dc] shadow-[0_1cqw_2.4cqw_rgba(0,0,0,0.3)]" style={{ transition: 'transform .5s var(--ease-spring), opacity .4s', transform: `translate(-50%, -50%) scale(${open ? 0.2 : 1})`, opacity: open ? 0 : 1 }}>
              ♥
            </div>
          </div>
        </div>

        {!open ? (
          <Reveal delay={600} className="absolute inset-x-0 top-[22%] text-center">
            <p className="font-script text-[10cqw] leading-tight text-[#b3244f]">You have a letter</p>
            <p className="mt-[1.4cqw] text-[3.4cqw] font-medium tracking-wide text-[#8a4a5d]">from {w.hasFrom ? w.from : 'someone who loves you'}</p>
          </Reveal>
        ) : null}
      </Board>

      <button type="button" aria-label="Open the letter" onClick={openIt} className="absolute inset-0 z-[5] cursor-pointer focus:outline-none" tabIndex={-1} />
    </Stage>
  );
}
