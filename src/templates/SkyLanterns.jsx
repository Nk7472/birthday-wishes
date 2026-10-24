import { useEffect, useState } from 'react';
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
import { confetti } from '../lib/confetti';
import { fitName } from '../lib/fit';

const PAPER = 'radial-gradient(ellipse at 50% 88%, #fff6c9 0, #ffc766 34%, #ff8f3f 72%, #d45a2b 100%)';
const RIBS = 'repeating-linear-gradient(90deg, rgba(110,30,0,0.16) 0 0.35cqmin, transparent 0.35cqmin 25%)';

/** A paper lantern. w/h in cqw (board units); children are printed on the paper. */
function Lantern({ w, h, unit = 'cqw', children, className = '', style }) {
  return (
    <div className={`relative ${className}`} style={{ width: `${w}${unit}`, height: `${h}${unit}`, ...style }}>
      <div className="pointer-events-none absolute -inset-[42%] rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,170,70,0.5), transparent 62%)', animation: 'lanternGlow 3.4s ease-in-out infinite' }} />
      <div className="absolute inset-x-[10%] top-0 h-[7%] rounded-sm bg-[#4a1d0e]" />
      <div className="absolute inset-x-0 bottom-[5%] top-[5%] overflow-hidden" style={{ background: PAPER, clipPath: 'polygon(9% 0, 91% 0, 100% 100%, 0 100%)', borderRadius: '10% 10% 4% 4%' }}>
        <div className="absolute inset-0" style={{ background: RIBS }} />
        <div className="relative flex h-full w-full flex-col items-center justify-center">{children}</div>
      </div>
      <div className="absolute inset-x-[12%] bottom-[2%] h-[6%] rounded-sm bg-[#4a1d0e]" />
      <div className="absolute bottom-[-1%] left-1/2 h-[7%] w-[16%] -translate-x-1/2 rounded-full bg-[#fff2b0]" style={{ boxShadow: '0 0 3cqmin 1.4cqmin rgba(255,200,90,0.9)', animation: 'flicker 1.6s ease-in-out infinite' }} />
    </div>
  );
}

export default function SkyLanterns() {
  const w = useWish();
  const step = useTimeline([500, 3800, 9400, 13000]);
  const [sent, setSent] = useState([]);
  const title = `Happy ${w.ordinal ? `${w.ordinal} ` : ''}Birthday`;
  const msgSize = w.message.length > 200 ? 3.2 : w.message.length > 120 ? 3.6 : 4;

  useEffect(() => {
    if (step === 1) sfx.whoosh();
    if (step === 2) {
      const t = [0, 1600, 3200].map((d) => setTimeout(() => sfx.whoosh(), d));
      t.push(setTimeout(() => sfx.chime(784), 3300), setTimeout(() => sfx.chime(988), 4900));
      return () => t.forEach(clearTimeout);
    }
    if (step === 3) {
      sfx.whoosh();
      const t = setTimeout(() => sfx.sparkle(), 2600);
      return () => clearTimeout(t);
    }
    if (step === 4) sfx.chime(1046);
  }, [step]);

  const release = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    setSent((s) => [...s.slice(-7), { id: `${Date.now()}-${Math.random()}`, x: Math.min(92, Math.max(2, x - 4)), size: 11 + Math.random() * 6, dur: 14 + Math.random() * 6 }]);
    sfx.whoosh();
    confetti.burst({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height, count: 8, spread: 80, power: 0.4, gravity: -0.1, colors: ['#ffd27a', '#ffb347', '#fff2b0'], shapes: ['circle'], ttl: 1.6, size: 0.7 });
  };

  const wishPos = [
    { x: 19, top: 14.5, delay: 0, rot: -4 },
    { x: 50, top: 7.5, delay: 1600, rot: 2 },
    { x: 81, top: 16.5, delay: 3200, rot: 4 },
  ];

  return (
    <Stage className="bg-[#14143a] text-white">
      {/* dusk sky */}
      <div className="absolute inset-0 bg-linear-to-b from-[#0d0d2e] via-[#3b2a6b] via-38% to-[#e0607a]" />
      <div className="absolute inset-x-0 top-[44%] h-[22%] bg-linear-to-b from-transparent via-[#ff9a6a]/70 to-[#ffcf8a]/50" />
      <Drift count={60} seed={3} anim="twinkle" size={[1.5, 4]} duration={[2, 6]} y={[0, 52]} colors={['#ffffff', '#ffe9c4', '#cfe0ff']}>
        {(p) => <span className="block h-full w-full rounded-full" style={{ background: p.color, boxShadow: `0 0 ${p.size * 2}px ${p.color}` }} />}
      </Drift>

      {/* moon */}
      <div className="absolute left-[9%] top-[8%] h-[17cqmin] w-[17cqmin] rounded-full" style={{ background: 'radial-gradient(circle at 36% 34%, #fffdf0, #f2e8bb 70%, #d9cb94)', boxShadow: '0 0 6cqmin 2cqmin rgba(255,244,200,0.55), 0 0 22cqmin 8cqmin rgba(255,230,170,0.22)' }}>
        <span className="absolute left-[26%] top-[30%] h-[18%] w-[18%] rounded-full bg-[#d9cb94]/50" />
        <span className="absolute left-[56%] top-[56%] h-[24%] w-[24%] rounded-full bg-[#d9cb94]/40" />
      </div>

      {/* far shore */}
      <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 top-[53%] h-[10%] w-full" aria-hidden="true">
        <path d="M0 20 L0 11 L9 6 L17 10 L27 3 L37 9 L46 5 L57 11 L68 4 L79 10 L90 6 L100 11 L100 20 Z" fill="#2a1a4a" opacity="0.8" />
        <path d="M0 20 L0 15 L8 13 L14 15 L24 11 L34 15 L45 13 L56 16 L68 12 L80 15 L91 13 L100 15 L100 20 Z" fill="#150c2b" />
      </svg>

      {/* lake */}
      <div className="absolute inset-x-0 bottom-0 top-[62.5%] bg-linear-to-b from-[#5a2c62] via-[#251345] to-[#0a0620]" />
      <div className="pointer-events-none absolute inset-x-0 top-[62.5%] h-[0.5%] bg-[#ffd9a8]/60 blur-[1px]" />
      <div className="pointer-events-none absolute top-[63%] h-[22%] w-[9cqmin] opacity-60" style={{ left: 'calc(9% + 4cqmin)', background: 'linear-gradient(to bottom, rgba(255,240,200,0.7), transparent)', maskImage: 'linear-gradient(to right, transparent, #000 35%, #000 65%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, #000 35%, #000 65%, transparent)' }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <span key={i} className="absolute h-[0.7cqmin] rounded-full bg-[#0a0620]/55" style={{ top: `${i * 17}%`, left: `${(i % 2) * 20}%`, right: `${((i + 1) % 2) * 20}%`, animation: `ripple ${3 + i * 0.4}s ease-in-out ${i * -0.5}s infinite alternate` }} />
        ))}
      </div>
      {step >= 2 ? (
        <div className="pointer-events-none absolute inset-x-0 top-[64%] h-[30%]">
          {[8, 24, 38, 53, 66, 80, 90].map((x, i) => (
            <span key={x} className="absolute h-[0.9cqmin] rounded-full bg-[#ffc46a]/35" style={{ left: `${x}%`, top: `${(i * 37) % 90}%`, width: `${9 + (i % 3) * 5}cqmin`, animation: `ripple ${3.4 + i * 0.3}s ease-in-out ${-i * 0.7}s infinite alternate` }} />
          ))}
        </div>
      ) : null}

      <Drift count={14} seed={9} anim="float-slow" size={[3, 6]} duration={[5, 9]} y={[66, 96]} colors={['#ffe98a']}>
        {() => <span className="block h-full w-full animate-twinkle rounded-full bg-[#ffe98a]" style={{ boxShadow: '0 0 1.4cqmin 0.5cqmin rgba(255,226,120,0.9)' }} />}
      </Drift>

      {/* tap layer */}
      <div className="absolute inset-0" onPointerDown={release} />

      {/* ambient lanterns */}
      {step >= 2 ? (
        <Drift count={18} seed={21} anim="rise" size={[14, 30]} duration={[26, 46]} delay={[0, 20]} prefill={false} sway className="opacity-90">
          {(p) => <Lantern w={p.size} h={p.size * 1.22} unit="px" />}
        </Drift>
      ) : null}

      {/* the lone first lantern */}
      {step >= 1 ? (
        <div className="pointer-events-none absolute left-[38%] top-0" style={{ animation: 'riseUp 11s ease-in-out both' }}>
          <Lantern w={13} h={16} unit="cqmin" />
        </div>
      ) : null}

      {/* lanterns released by tapping */}
      {sent.map((s) => (
        <div key={s.id} className="pointer-events-none absolute top-0" style={{ left: `${s.x}%`, animation: `riseUp ${s.dur}s ease-in both` }} onAnimationEnd={() => setSent((q) => q.filter((z) => z.id !== s.id))}>
          <Lantern w={s.size} h={s.size * 1.22} unit="cqmin" />
        </div>
      ))}

      {/* the page */}
      <div className="pointer-events-none absolute inset-0 z-10">
        <Board className="pointer-events-none">
          {/* three wish lanterns */}
          {step >= 2
            ? wishPos.map((p, i) => (
                <div key={i} className="absolute" style={{ left: `${p.x - 13.5}%`, top: `${p.top}%`, width: '27cqw', '--y0': '95cqh', animation: 'lanternUp 3.6s cubic-bezier(0.2,0.8,0.3,1) both', animationDelay: `${p.delay}ms` }}>
                  <div className="animate-float-slow" style={{ animationDelay: `${i * -1.4}s`, animationDuration: '6s' }}>
                    <div style={{ transform: `rotate(${p.rot}deg)` }}>
                      <Lantern w={27} h={33}>
                        <p className="px-[4cqw] text-center font-playfair font-semibold italic leading-[1.15] text-[#5a1a08]" style={{ fontSize: `${w.wishes[i].length > 30 ? 2.6 : 3.1}cqw` }}>{w.wishes[i]}</p>
                      </Lantern>
                    </div>
                  </div>
                </div>
              ))
            : null}

          {/* the big birthday lantern */}
          {step >= 3 ? (
            <div className="absolute top-[31.5%] left-[26%]" style={{ width: '48cqw', '--y0': '90cqh', animation: 'lanternUp 4.4s cubic-bezier(0.2,0.8,0.3,1) both' }}>
              <div className="animate-float-slow" style={{ animationDuration: '7s' }}>
                <Lantern w={48} h={58}>
                  <div className="relative mt-[3cqw]">
                    <Avatar className="h-[24cqw] w-[24cqw] border-[1cqw] border-[#fff0c2]" fallbackClassName="bg-gradient-to-br from-[#ffb36b] to-[#d9582a]" textClassName="font-playfair font-bold text-[#fff4d6]" style={{ boxShadow: '0 0 5cqw rgba(255,240,180,0.9)' }} />
                    {w.ageText ? <span className="absolute -bottom-[1cqw] -right-[3cqw] grid h-[10cqw] w-[10cqw] place-items-center rounded-full border-[0.7cqw] border-[#fff0c2] bg-[#a8341a] font-playfair text-[5cqw] font-bold text-[#fff4d6]">{w.ageText}</span> : null}
                  </div>
                  <p className="mt-[2.4cqw] max-w-[40cqw] text-center font-script font-bold leading-none text-[#5a1a08]" style={{ fontSize: fitName(w.name, 10.5, { width: 36 }) }}>{w.name}</p>
                </Lantern>
              </div>
            </div>
          ) : null}

          {/* greeting */}
          {step >= 3 ? (
            <div className="absolute inset-x-[4cqw] top-[61.4%] text-center">
              <SplitText text={title} delay={2400} stagger={55} anim="fade-up" className="font-script text-[8.4cqw] leading-tight text-amber-100" letterStyle={() => ({ textShadow: '0 0 4cqw rgba(255,190,90,0.9)' })} />
            </div>
          ) : null}

          {/* message */}
          {step >= 4 ? (
            <Reveal anim="fade-up" className="absolute inset-x-[7cqw] top-[69.6%]">
              <div className="flex h-[36cqw] flex-col justify-center rounded-[3cqw] border border-amber-200/40 bg-gradient-to-b from-[#3b1d4f]/80 to-[#1d0f33]/85 px-[5cqw] py-[2cqw] text-center shadow-[0_0_6cqw_rgba(255,160,80,0.35)]-[2px]">
                <p className="font-playfair italic leading-[1.3] text-amber-50" style={{ fontSize: `${msgSize}cqw` }}>
                  <Typewriter text={w.message} speed={26} cursor={false} />
                </p>
                {w.hasFrom ? <p className="mt-[1.4cqw] font-script text-[6cqw] leading-none text-amber-200">— {w.from}</p> : null}
              </div>
            </Reveal>
          ) : null}
        </Board>
      </div>

    </Stage>
  );
}
