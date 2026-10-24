import { useEffect, useRef, useState } from 'react';
import Avatar from '../components/shared/Avatar';
import { useAudioLevelRef, useRaf, useTimeline } from '../components/shared/hooks';
import Reveal from '../components/shared/Reveal';
import Stage from '../components/shared/Stage';
import Typewriter from '../components/shared/Typewriter';
import { useWish } from '../components/shared/WishContext';
import { sfx } from '../lib/audio';
import { confetti } from '../lib/confetti';
import { fitName } from '../lib/fit';

const MAGENTA = '#ff2e93';
const CYAN = '#21e6ff';
const glow = (c) => `0 0 0.06em #fff, 0 0 0.16em ${c}, 0 0 0.4em ${c}, 0 0 0.9em ${c}, 0 0 1.6em ${c}`;

/** Neon tube text whose letters buzz on one at a time. */
function NeonText({ text, color, delay = 0, className = '', style }) {
  let i = 0;
  return (
    <span className={`inline-block animate-[neonHum_5s_ease-in-out_infinite] ${className}`} style={{ color, textShadow: glow(color), ...style }} aria-label={text}>
      {[...text].map((ch, k) => {
        const n = i++;
        if (ch === ' ') return <span key={k} className="inline-block w-[0.35em]" />;
        const jitter = (n * 53) % 140;
        return (
          <span key={k} aria-hidden="true" className="inline-block" style={{ opacity: 0, animation: `neonOn ${0.9 + (n % 3) * 0.25}s linear both`, animationDelay: `${delay + n * 150 + jitter}ms` }}>
            {ch}
          </span>
        );
      })}
    </span>
  );
}

function Palm({ className = '', flip }) {
  return (
    <svg viewBox="0 0 100 160" className={className} style={{ transform: flip ? 'scaleX(-1)' : undefined }} aria-hidden="true">
      <path d="M52 160 C 50 120, 54 90, 46 58" stroke="#0b0020" strokeWidth="5" fill="none" strokeLinecap="round" />
      {[-70, -35, -5, 30, 62, 100].map((a, k) => (
        <path key={k} d="M46 58 C 62 38, 86 44, 96 62 C 78 54, 62 52, 46 58 Z" fill="#0b0020" transform={`rotate(${a} 46 58)`} />
      ))}
    </svg>
  );
}

export default function NeonNights() {
  const w = useWish();
  const step = useTimeline([300, 3000, 4200, 6800]);
  const level = useAudioLevelRef();
  const bars = useRef([]);
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    if (step === 1) sfx.tick();
    if (step === 2) sfx.sparkle();
    if (step === 3) sfx.sparkle();
  }, [step]);

  // equalizer: reacts to the music when it is audible, otherwise a lively fallback
  useRaf((now) => {
    const lv = level.current;
    const amp = lv > 0.02 ? 0.25 + lv * 1.7 : 0.6;
    bars.current.forEach((el, i) => {
      if (!el) return;
      const base = 0.28 + 0.72 * Math.abs(Math.sin(now / 240 + i * 0.9) * Math.cos(now / 410 + i * 0.37));
      el.style.transform = `scaleY(${Math.min(1, base * amp).toFixed(3)})`;
    });
  });

  const drop = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setBeat((b) => b + 1);
    sfx.kick();
    confetti.burst({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height, count: 70, spread: 360, power: 0.8, gravity: 0.6, colors: [MAGENTA, CYAN, '#ffe14d', '#a97bff'], shapes: ['rect', 'circle'] });
  };

  const nameFont = fitName(w.name, 11, { factor: 0.62 });
  const msgText = `> ${w.message}`;

  return (
    <Stage className="bg-[#12002b] text-white">
      {/* backdrop: recolours on every tap */}
      <div className="absolute inset-0 transition-[filter] duration-700" style={{ filter: `hue-rotate(${beat * 58}deg)` }}>
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#14003a_0%,#3b0a6b_32%,#b3166f_52%,#ff7a3d_60%,#1a0538_60.2%)]" />
        {/* striped sun */}
        <svg viewBox="0 0 100 100" className="absolute left-1/2 top-[22%] h-[44cqh] max-h-[110cqmin] -translate-x-1/2 animate-float-slow" aria-hidden="true" style={{ aspectRatio: '1' }}>
          <defs>
            <linearGradient id="nn-sun" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffe14d" />
              <stop offset="0.55" stopColor="#ff7a3d" />
              <stop offset="1" stopColor="#ff2e93" />
            </linearGradient>
            <mask id="nn-m">
              <rect width="100" height="100" fill="#fff" />
              {[56, 65, 73, 80, 86, 91].map((y, k) => (
                <rect key={y} x="0" y={y} width="100" height={1.2 + k * 0.9} fill="#000" />
              ))}
            </mask>
          </defs>
          <circle cx="50" cy="50" r="48" fill="url(#nn-sun)" mask="url(#nn-m)" />
        </svg>
        {/* wireframe mountains */}
        <svg viewBox="0 0 400 60" preserveAspectRatio="none" className="absolute inset-x-0 top-[calc(60%-14cqmin)] h-[14cqmin] w-full" aria-hidden="true">
          <path d="M0 60 L0 38 L40 14 L70 36 L110 8 L150 40 L190 22 L232 44 L280 10 L330 38 L366 20 L400 40 L400 60 Z" fill="#12002b" stroke={MAGENTA} strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
        </svg>
        {/* grid floor */}
        <div className="absolute inset-x-0 bottom-0 top-[60%] overflow-hidden bg-[#1a0538]" style={{ perspective: '100cqmin', perspectiveOrigin: '50% 0%' }}>
          <div className="absolute -inset-x-[25%] top-0 h-[85cqmin] origin-top" style={{ transform: 'rotateX(70deg)', overflow: 'hidden' }}>
            <div
              className="absolute inset-x-0 bottom-0 -top-[12cqmin] animate-[tileY_1.6s_linear_infinite]"
              style={{
                '--tile': '12cqmin',
                backgroundImage: `linear-gradient(${CYAN} 0.35cqmin, transparent 0.35cqmin), linear-gradient(90deg, ${CYAN} 0.35cqmin, transparent 0.35cqmin)`,
                backgroundSize: '12cqmin 12cqmin',
                opacity: 0.75,
              }}
            />
          </div>
          <div className="absolute inset-x-0 top-0 h-[10cqmin] bg-gradient-to-b from-[#ff2e93]/70 to-transparent" />
        </div>
        <Palm className="absolute bottom-[38%] left-[-3cqmin] h-[36cqmin]" />
        <Palm className="absolute bottom-[38%] right-[-3cqmin] h-[30cqmin]" flip />
      </div>

      {/* equalizer */}
      <div className="pointer-events-none absolute inset-x-[3cqmin] bottom-0 z-10 flex h-[11cqmin] items-end gap-[0.6cqmin] opacity-80">
        {Array.from({ length: 28 }).map((_, i) => (
          <div key={i} ref={(el) => (bars.current[i] = el)} className="h-full flex-1 origin-bottom rounded-t-[0.4cqmin]" style={{ background: `linear-gradient(to top, ${MAGENTA}, ${CYAN})`, transform: 'scaleY(0.3)' }} />
        ))}
      </div>

      {/* content */}
      <div className="pointer-events-none absolute inset-0 z-20 mx-auto flex h-full w-full max-w-[min(100cqw,74cqh)] flex-col items-center px-[4cqmin] pb-[13cqmin] pt-[10cqmin]">
        <div className="text-center font-monoton leading-[1.12]" style={{ fontSize: 'min(13cqmin, 9cqh)' }}>
          <div><NeonText text="HAPPY" color={MAGENTA} delay={300} /></div>
          <div style={{ fontSize: '0.78em' }}><NeonText text="BIRTHDAY" color={MAGENTA} delay={1200} /></div>
        </div>

        {step >= 2 ? (
          <div className="relative mt-[4cqmin]">
            <div className="animate-[vhsIn_1.1s_steps(14,end)_both]">
              <div className="relative rounded-[4cqmin] p-[1cqmin]" style={{ boxShadow: `0 0 0 0.7cqmin ${CYAN}, 0 0 3cqmin ${CYAN}, inset 0 0 2cqmin ${CYAN}`, background: '#0a0020' }}>
                <Avatar rounded="rounded-[3cqmin]" className="h-[min(34cqmin,21cqh)] w-[min(34cqmin,21cqh)]" />
                <div className="pointer-events-none absolute inset-[1cqmin] rounded-[3cqmin] bg-[repeating-linear-gradient(to_bottom,rgba(0,0,0,0.0)_0,rgba(0,0,0,0.0)_0.5cqmin,rgba(0,0,0,0.28)_0.5cqmin,rgba(0,0,0,0.28)_0.8cqmin)]" />
                <div className="pointer-events-none absolute inset-[1cqmin] rounded-[3cqmin] bg-[linear-gradient(135deg,rgba(255,255,255,0.22),transparent_40%)]" />
              </div>
            </div>
            {w.ageText ? (
              <span className="absolute -bottom-[2.4cqmin] -right-[4cqmin] rotate-[-8deg] rounded-md border-2 px-[2cqmin] py-[0.6cqmin] font-righteous text-[4.4cqmin] animate-[neonHum_4s_ease-in-out_infinite]" style={{ color: '#ffe14d', borderColor: '#ffe14d', textShadow: glow('#ffe14d'), boxShadow: '0 0 1.4cqmin #ffe14d, inset 0 0 1cqmin #ffe14d55', background: '#12002bcc' }}>
                {w.ageText}
              </span>
            ) : null}
          </div>
        ) : (
          <div style={{ height: 'min(34cqmin,21cqh)', marginTop: '4cqmin' }} />
        )}

        <div className="mt-[4.5cqmin] text-center font-righteous leading-none" style={{ fontSize: nameFont }}>
          {step >= 3 ? <NeonText text={w.name} color={CYAN} delay={0} /> : null}
        </div>

        <div className="flex-1" />

        {step >= 4 ? (
          <Reveal anim="fade-up" className="w-full max-w-[92cqmin] rounded-[2cqmin] border bg-[#0a0020]/80 px-[4cqmin] py-[3cqmin]" style={{ borderColor: CYAN, boxShadow: `0 0 2.4cqmin ${CYAN}66, inset 0 0 1.6cqmin ${CYAN}22` }}>
            <p className="font-mono text-[clamp(0.72rem,3cqmin,1.1rem)] leading-relaxed" style={{ color: '#bffcff' }}>
              <Typewriter text={msgText} speed={26} />
            </p>
            {w.hasFrom ? <p className="mt-[1.6cqmin] text-right font-righteous text-[clamp(0.85rem,3.6cqmin,1.3rem)]" style={{ color: MAGENTA, textShadow: `0 0 1.4cqmin ${MAGENTA}` }}>— {w.from}</p> : null}
          </Reveal>
        ) : null}
      </div>

      {/* CRT overlay, flash and tap layer */}
      <div className="pointer-events-none absolute inset-0 z-30 bg-[repeating-linear-gradient(to_bottom,rgba(0,0,0,0.0)_0,rgba(0,0,0,0.0)_0.6cqmin,rgba(0,0,0,0.14)_0.6cqmin,rgba(0,0,0,0.14)_0.9cqmin)]" />
      <div className="pointer-events-none absolute inset-0 z-30 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.55)_100%)]" />
      {beat > 0 ? <div key={beat} className="pointer-events-none absolute inset-0 z-40 animate-flash bg-white/55" /> : null}
      <div className="absolute inset-0 z-[35] cursor-pointer" onPointerDown={drop} aria-hidden="true" />
    </Stage>
  );
}
