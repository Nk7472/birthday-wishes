import { useEffect, useState } from 'react';
import Avatar from '../components/shared/Avatar';
import Balloon from '../components/shared/Balloon';
import Drift from '../components/shared/Drift';
import { useTimeline } from '../components/shared/hooks';
import Reveal from '../components/shared/Reveal';
import Stage from '../components/shared/Stage';
import { useWish } from '../components/shared/WishContext';
import { sfx } from '../lib/audio';
import { confetti } from '../lib/confetti';
import { fitName } from '../lib/fit';

const GOLD = 'linear-gradient(90deg,#b8862b,#ffe08a 35%,#fff2c2 50%,#ffd35e 65%,#b8862b)';
const TAGS = ['#ffd6e0', '#d6efff', '#fff0b8'];
const FACE = { backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', containerType: 'size' };

function Bow() {
  return (
    <svg viewBox="0 0 120 70" className="absolute -top-[9.5cqmin] left-1/2 w-[24cqmin] -translate-x-1/2 drop-shadow-lg" aria-hidden="true">
      <defs>
        <linearGradient id="bowg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff2c2" />
          <stop offset="0.5" stopColor="#ffcf4d" />
          <stop offset="1" stopColor="#b8862b" />
        </linearGradient>
      </defs>
      <path d="M60 46 C 38 66, 6 62, 8 34 C 10 10, 42 14, 60 40 Z" fill="url(#bowg)" />
      <path d="M60 46 C 82 66, 114 62, 112 34 C 110 10, 78 14, 60 40 Z" fill="url(#bowg)" />
      <path d="M26 38 C 28 26, 42 28, 52 40 M94 38 C 92 26, 78 28, 68 40" fill="none" stroke="#b8862b" strokeWidth="2" opacity="0.5" />
      <path d="M52 44 L38 68 M68 44 L82 68" stroke="url(#bowg)" strokeWidth="9" strokeLinecap="round" />
      <ellipse cx="60" cy="42" rx="11" ry="10" fill="url(#bowg)" />
      <ellipse cx="57" cy="38" rx="4" ry="3" fill="#fff" opacity="0.55" />
    </svg>
  );
}

export default function SurpriseBox() {
  const w = useWish();
  const step = useTimeline([200, 1500, 3600, 5600, 7800]);
  const [tapped, setTapped] = useState(false);
  const [cardUp, setCardUp] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [touched, setTouched] = useState(false);
  const [lidGone, setLidGone] = useState(false);
  const opened = tapped || step >= 5;
  const tension = opened ? 0 : Math.min(3, Math.max(0, step - 1));

  useEffect(() => {
    if (step !== 1) return;
    const t = setTimeout(() => sfx.pop(), 650);
    return () => clearTimeout(t);
  }, [step]);

  useEffect(() => {
    if (tension < 1) return;
    const iv = setInterval(() => sfx.tick(), [0, 800, 500, 260][tension]);
    return () => clearInterval(iv);
  }, [tension]);

  useEffect(() => {
    if (!opened) return;
    sfx.boom();
    sfx.tada();
    confetti.cannons();
    confetti.burst({ x: 0.5, y: 0.6, count: 90, angle: -90, spread: 70, power: 1.5 });
    const t = [
      setTimeout(() => {
        setCardUp(true);
        sfx.whoosh();
      }, 1000),
      setTimeout(() => confetti.rain({ duration: 4500 }), 1400),
      setTimeout(() => sfx.chime(880), 2600),
      setTimeout(() => setLidGone(true), 1700),
    ];
    return () => t.forEach(clearTimeout);
  }, [opened]);

  useEffect(() => {
    if (!cardUp || touched) return;
    const t = setTimeout(() => {
      setFlipped(true);
      sfx.pop();
    }, 5200);
    return () => clearTimeout(t);
  }, [cardUp, touched]);

  const flip = () => {
    setTouched(true);
    setFlipped((f) => !f);
    sfx.pop();
  };

  const bgTap = (e) => {
    if (!opened) return;
    const r = e.currentTarget.getBoundingClientRect();
    confetti.burst({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height, count: 18, spread: 160, power: 0.8, emojis: ['🎁', '✨', '🎉', '💖'], ttl: 3 });
    sfx.sparkle();
  };

  const title = `Happy ${w.ordinal ? `${w.ordinal} ` : ''}Birthday`;
  const msgSize = w.message.length > 200 ? 5 : w.message.length > 120 ? 5.6 : 6.2;

  return (
    <Stage className="bg-[#2a0f3a] text-white">
      {/* room */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,#6a2a7a_0%,#3a1450_45%,#1c0828_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-[34%] bg-linear-to-t from-[#12051c] via-[#26103a] to-transparent" />
      <div className="absolute inset-0" onPointerDown={bgTap} />

      {/* spotlight */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-full w-[130cqmin] -translate-x-1/2 animate-pulse-glow"
        style={{ clipPath: 'polygon(44% 0, 56% 0, 100% 100%, 0 100%)', background: 'linear-gradient(to bottom, rgba(255,236,190,0.34), rgba(255,236,190,0.04) 85%)' }}
      />
      <Drift count={26} anim="twinkle" size={[2, 6]} duration={[2, 5]} colors={['#ffe9a8', '#ffffff', '#ffc4d6']} className="pointer-events-none">
        {(p) => <span className="block h-full w-full rounded-full" style={{ background: p.color, boxShadow: `0 0 ${p.size * 2}px ${p.color}` }} />}
      </Drift>

      {/* title before the opening */}
      <div className="pointer-events-none absolute inset-x-0 top-[11%] text-center transition-all duration-700" style={{ opacity: opened ? 0 : 1, transform: opened ? 'translateY(-4cqmin)' : 'none' }}>
        <Reveal anim="fade-up" delay={900}>
          <p className="font-playfair text-[4.6cqmin] italic text-amber-100/90">A little surprise for</p>
          <p className="font-script leading-tight text-amber-200" style={{ fontSize: fitName(w.name, 15, { width: 70 }), textShadow: '0 0 4cqmin rgba(255,200,90,0.5)' }}>
            {w.name}
          </p>
        </Reveal>
      </div>

      {/* balloons */}
      {opened ? (
        <Drift count={11} seed={7} anim="rise" size={[34, 62]} duration={[8, 14]} delay={[0.2, 2.4]} prefill={false} sway className="pointer-events-none z-10">
          {(p) => <Balloon color={p.color} label={['★', '♥', '✦', '🎉'][p.i % 4]} className="w-full" />}
        </Drift>
      ) : null}

      {/* the box */}
      <div
        className="absolute left-1/2 z-20 w-[46cqmin]"
        style={{
          top: opened ? '80%' : '62%',
          transform: `translate(-50%,-50%) scale(${opened ? 0.68 : 1})`,
          transition: 'top 1.1s cubic-bezier(0.3,1.2,0.4,1), transform 1.1s cubic-bezier(0.3,1.2,0.4,1)',
        }}
      >
        {/* light column + shockwaves */}
        {opened ? (
          <>
            <div className="pointer-events-none absolute bottom-[26cqmin] left-1/2 h-[130cqh] w-[40cqmin] -translate-x-1/2 opacity-0" style={{ background: 'linear-gradient(to top, rgba(255,240,190,0.85), rgba(255,240,190,0))', clipPath: 'polygon(30% 100%, 70% 100%, 100% 0, 0 0)', animation: 'hush 1.8s ease-out both' }} />
            {[0, 220].map((d) => (
              <div key={d} className="pointer-events-none absolute left-1/2 top-[-4cqmin] h-[30cqmin] w-[30cqmin] -translate-x-1/2 rounded-full border-[1cqmin] border-amber-200/80" style={{ animation: 'ringOut 1.3s ease-out both', animationDelay: `${d}ms` }} />
            ))}
          </>
        ) : null}

        <div className="absolute inset-x-[-4cqmin] -bottom-[3cqmin] h-[7cqmin] rounded-full bg-black/45 blur-[1.4cqmin]" />

        <div style={{ animation: 'jelly 1.15s both', animationDelay: '0.2s' }}>
          <div style={{ animation: tension ? `rumble ${[0, 0.5, 0.26, 0.13][tension]}s linear infinite` : undefined }}>
            <button
              type="button"
              disabled={opened}
              onPointerDown={() => setTapped(true)}
              aria-label="Open the gift"
              className="relative mt-[9cqmin] block h-[32cqmin] w-full cursor-pointer rounded-b-[1.6cqmin] text-left"
              style={{ background: 'linear-gradient(90deg,#a31544,#e8365f 28%,#ff6d8e 50%,#e8365f 72%,#8f1038)', boxShadow: 'inset 0 -4cqmin 5cqmin rgba(60,0,20,0.35)' }}
            >
              <span className="absolute inset-0 rounded-b-[1.6cqmin] opacity-60" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.22) 18%, transparent 20%)', backgroundSize: '4.4cqmin 4.4cqmin' }} />
              <span className="absolute inset-y-0 left-1/2 w-[8cqmin] -translate-x-1/2" style={{ background: GOLD }} />
              <span className="absolute inset-x-0 top-0 h-[4cqmin] bg-black/30" />
              <span className="absolute inset-0 overflow-hidden rounded-b-[1.6cqmin]"><span className="absolute inset-0 animate-[sheen_3.6s_ease-in-out_infinite] opacity-30" style={{ background: 'linear-gradient(105deg,transparent 40%,#fff 50%,transparent 60%)' }} /></span>
              {/* glow leaking through the seam */}
              <span className="absolute inset-x-[2cqmin] -top-[1cqmin] h-[3cqmin] rounded-full transition-opacity duration-700" style={{ opacity: opened ? 1 : tension * 0.28, background: '#fff3c4', boxShadow: '0 0 5cqmin 2cqmin rgba(255,226,140,0.9)' }} />
            </button>

            {/* lid */}
            {lidGone ? null : (
            <div className="pointer-events-none absolute -left-[2.5cqmin] top-0 h-[10cqmin] w-[51cqmin]" style={{ animation: opened ? 'lidBlast 1.5s cubic-bezier(0.3,0,0.8,0.4) both' : undefined }}>
              <div className="relative h-full w-full rounded-[1.4cqmin]" style={{ background: 'linear-gradient(90deg,#8f1038,#d42c57 28%,#ff5d86 50%,#d42c57 72%,#7a0d30)', boxShadow: '0 1.2cqmin 2cqmin rgba(0,0,0,0.4), inset 0 -1.4cqmin 2cqmin rgba(60,0,20,0.4)' }}>
                <span className="absolute inset-y-0 left-1/2 w-[8.6cqmin] -translate-x-1/2" style={{ background: GOLD }} />
                <Bow />
              </div>
            </div>
            )}
          </div>
        </div>

        {!opened ? (
          <p className="pointer-events-none absolute left-1/2 top-full mt-[7cqmin] -translate-x-1/2 whitespace-nowrap text-center font-ui text-[3.6cqmin] font-semibold tracking-wide text-amber-100/90 animate-pulse">
            Tap the box to open it ✨
          </p>
        ) : null}
      </div>

      {/* the card */}
      <div
        className="absolute left-1/2 top-[37%] z-30"
        style={{
          width: 'min(78cqw, 40cqh)',
          aspectRatio: '1 / 1.34',
          opacity: cardUp ? 1 : 0,
          pointerEvents: cardUp ? 'auto' : 'none',
          transform: cardUp ? 'translate(-50%,-50%) scale(1) rotate(0deg)' : 'translate(-50%, 50cqh) scale(0.25) rotate(-14deg)',
          transition: 'transform 1.5s cubic-bezier(0.2,1.15,0.3,1), opacity 0.4s',
        }}
      >
        <div className="animate-float-slow h-full w-full">
          <div className="h-full w-full" style={{ perspective: '180cqmin' }}>
            <div
              role="button"
              tabIndex={0}
              aria-label="Flip the card"
              onPointerDown={flip}
              className="relative h-full w-full cursor-pointer"
              style={{ transformStyle: 'preserve-3d', transform: `rotateY(${flipped ? 180 : 0}deg)`, transition: 'transform 1.1s cubic-bezier(0.3,1.1,0.4,1)' }}
            >
              {/* front */}
              <div className="absolute inset-0 overflow-hidden rounded-[4cqmin] bg-[#fff6e6] shadow-[0_3cqmin_7cqmin_rgba(0,0,0,0.55)]" style={FACE}>
                <div className="absolute inset-[3.4cqmin] rounded-[2.4cqmin] border-[0.6cqmin] border-amber-400/70" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,214,224,0.7),transparent_60%)]" />
                <span className="absolute left-[9cqmin] top-[9cqmin] animate-twinkle text-[5cqmin] text-amber-400">✦</span>
                <span className="absolute right-[9cqmin] top-[12cqmin] animate-twinkle text-[4cqmin] text-rose-300 [animation-delay:0.8s]">✦</span>
                <div className="relative flex h-full flex-col items-center justify-center gap-[2.4cqmin] px-[8cqmin] pb-[4cqmin] pt-[2cqmin] text-center">
                  <p className="font-playfair text-[4.2cqmin] italic text-rose-400">for someone special</p>
                  <div className="relative shrink-0">
                    <div className="rounded-full p-[1.3cqmin]" style={{ background: GOLD }}>
                      <Avatar className="h-[38cqmin] w-[38cqmin]" />
                    </div>
                    {w.ageText ? (
                      <div className="absolute -bottom-[1.5cqmin] -right-[3cqmin] grid h-[13cqmin] w-[13cqmin] place-items-center rounded-full border-[0.9cqmin] border-[#fff6e6] bg-gradient-to-br from-rose-400 to-rose-600 font-ui text-[6.4cqmin] font-extrabold text-white shadow-lg">
                        {w.ageText}
                      </div>
                    ) : null}
                  </div>
                  <p className="max-w-full font-script leading-[1.05] text-rose-700" style={{ fontSize: fitName(w.name, 15, { width: 80 }) }}>
                    {w.name}
                  </p>
                  <p className="font-playfair text-[6cqmin] font-semibold leading-tight text-[#6b2a43]">{title}</p>
                  <p className="font-ui text-[3.2cqmin] font-medium tracking-wider text-rose-400/80">TAP TO OPEN ↻</p>
                </div>
              </div>

              {/* back */}
              <div className="absolute inset-0 overflow-hidden rounded-[4cqmin] bg-[#fffaf0] shadow-[0_3cqmin_7cqmin_rgba(0,0,0,0.55)]" style={{ ...FACE, transform: 'rotateY(180deg)' }}>
                <div className="absolute inset-0 opacity-70" style={{ backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0, transparent 6.1cqmin, #cfe0f0 6.1cqmin, #cfe0f0 6.3cqmin)', backgroundPosition: '0 12cqmin' }} />
                <div className="absolute inset-[3.4cqmin] rounded-[2.4cqmin] border-[0.6cqmin] border-amber-400/60" />
                <div className="relative flex h-full flex-col px-[9cqmin] pb-[8cqmin] pt-[9cqmin]">
                  <p className="font-script leading-none text-rose-600" style={{ fontSize: fitName(`Dear ${w.name},`, 10.5, { width: 80 }) }}>
                    Dear {w.name},
                  </p>
                  <p className="mt-[2.6cqmin] font-hand font-bold leading-[1.25] text-[#3b2a52]" style={{ fontSize: `${msgSize}cqmin` }}>
                    {w.message}
                  </p>
                  {w.hasFrom ? <p className="mt-[2cqmin] text-right font-script text-[7cqmin] leading-none text-rose-600">with love, {w.from}</p> : null}
                  <div className="mt-auto flex shrink-0 justify-between gap-[2cqmin] pt-[2cqmin]">
                    {w.wishes.map((x, i) => (
                      <div key={i} className="relative flex h-[17cqmin] flex-1 items-center justify-center px-[1.2cqmin] pt-[2.6cqmin] text-center font-ui text-[3.1cqmin] font-bold leading-[1.1] text-[#4a3350] shadow-md" style={{ background: TAGS[i], clipPath: 'polygon(14% 0, 86% 0, 100% 16%, 100% 100%, 0 100%, 0 16%)', transform: `rotate(${[-3, 2, -2][i]}deg)` }}>
                        <span className="absolute left-1/2 top-[1.6cqmin] h-[2cqmin] w-[2cqmin] -translate-x-1/2 rounded-full bg-[#2a0f3a]/70" />
                        {x}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Stage>
  );
}
