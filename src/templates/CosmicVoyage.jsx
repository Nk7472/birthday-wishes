import { useEffect, useRef, useState } from 'react';
import Avatar from '../components/shared/Avatar';
import CanvasLayer from '../components/shared/CanvasLayer';
import Drift from '../components/shared/Drift';
import { useTimeline } from '../components/shared/hooks';
import Reveal from '../components/shared/Reveal';
import SplitText from '../components/shared/SplitText';
import Stage from '../components/shared/Stage';
import Typewriter from '../components/shared/Typewriter';
import { useWish } from '../components/shared/WishContext';
import { sfx } from '../lib/audio';
import { fitName } from '../lib/fit';

const CYAN = '#21d4fd';

/* ---------- warp-speed starfield ---------- */
function makeStars(w, h) {
  return {
    stars: Array.from({ length: 520 }, () => ({ x: (Math.random() - 0.5) * 3, y: (Math.random() - 0.5) * 3, z: Math.random(), hue: Math.random() })),
    speed: 1.6,
    boost: 0,
    sparks: [],
    w,
    h,
  };
}

function drawStars({ ctx, w, h, t, dt, state: s }) {
  // warp decelerates over ~4s, then settles into a slow drift
  const target = t < 0.8 ? 1.6 : Math.max(0.06, 1.6 * Math.pow(0.5, (t - 0.8) / 0.9));
  s.boost *= Math.pow(0.04, dt);
  s.speed += (target + s.boost - s.speed) * Math.min(1, dt * 4);
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2;
  const cy = h * 0.42;
  const F = Math.max(w, h) * 0.6;
  for (const st of s.stars) {
    const pz = st.z;
    st.z -= s.speed * dt * 0.6;
    if (st.z <= 0.01) {
      st.z = 1;
      st.x = (Math.random() - 0.5) * 3;
      st.y = (Math.random() - 0.5) * 3;
      continue;
    }
    const x = cx + (st.x / st.z) * F * 0.5;
    const y = cy + (st.y / st.z) * F * 0.5;
    const px = cx + (st.x / pz) * F * 0.5;
    const py = cy + (st.y / pz) * F * 0.5;
    if (x < -20 || x > w + 20 || y < -20 || y > h + 20) {
      st.z = 1;
      continue;
    }
    const a = Math.min(1, (1 - st.z) * 1.6 + 0.15);
    ctx.strokeStyle = st.hue > 0.85 ? `rgba(255,214,150,${a})` : st.hue < 0.2 ? `rgba(160,220,255,${a})` : `rgba(255,255,255,${a})`;
    ctx.lineWidth = 0.6 + (1 - st.z) * 1.7;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
  // tap sparkles
  s.sparks = s.sparks.filter((p) => {
    p.age += dt;
    if (p.age > 0.9) return false;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    ctx.globalAlpha = 1 - p.age / 0.9;
    ctx.fillStyle = p.c;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.8, 0, 6.283);
    ctx.fill();
    return true;
  });
  ctx.globalAlpha = 1;
}

const CONSTELLATION = [[8, 34], [22, 12], [38, 28], [54, 8], [70, 26], [86, 10], [92, 30]];

export default function CosmicVoyage() {
  const w = useWish();
  const step = useTimeline([500, 4200, 5600, 7400, 9600, 11200, 12800]);
  const [shoot, setShoot] = useState([]);
  const stateRef = useRef(null);
  const head = w.ordinal ? `Orbit #${w.age}` : 'Another trip around the sun';
  const sub = w.age ? `${w.age} trips around the sun` : '';

  useEffect(() => {
    if (step === 2) sfx.sparkle();
    if (step === 3) sfx.chime(660);
  }, [step]);

  const tap = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    sfx.sparkle();
    const s = stateRef.current;
    if (s) {
      s.boost = 2.2;
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * 6.283;
        s.sparks.push({ x, y, vx: Math.cos(a) * (60 + Math.random() * 90), vy: Math.sin(a) * (60 + Math.random() * 90), age: 0, c: i % 3 ? '#fff' : CYAN });
      }
    }
    const id = Date.now();
    setShoot((a) => [...a.slice(-3), { id, y: Math.max(8, (y / r.height) * 100 - 6) }]);
    setTimeout(() => setShoot((a) => a.filter((q) => q.id !== id)), 1400);
  };

  return (
    <Stage className="bg-[#05060f] text-white">
      {/* nebulae */}
      <div className="absolute -left-[20%] top-[8%] h-[70cqmin] w-[90cqmin] animate-float-slow rounded-full bg-[radial-gradient(circle,rgba(120,60,200,0.55),transparent_65%)] blur-2xl" />
      <div className="absolute -right-[25%] top-[44%] h-[80cqmin] w-[90cqmin] animate-float rounded-full bg-[radial-gradient(circle,rgba(215,109,119,0.4),transparent_65%)] blur-2xl" />
      <div className="absolute left-[10%] bottom-[-10%] h-[60cqmin] w-[80cqmin] rounded-full bg-[radial-gradient(circle,rgba(33,212,253,0.28),transparent_65%)] blur-2xl" />

      <CanvasLayer
        className="absolute inset-0"
        setup={(a) => (stateRef.current = makeStars(a.w, a.h))}
        draw={drawStars}
      />

      {/* shooting stars */}
      {shoot.map((s) => (
        <div key={s.id} className="pointer-events-none absolute left-0 z-10 h-[0.35cqmin] w-[30cqmin] bg-gradient-to-r from-transparent via-white to-transparent" style={{ top: `${s.y}%`, animation: 'flareSweep 1.2s ease-out both', transformOrigin: 'left' }} />
      ))}
      <Drift count={60} seed={21} anim="twinkle" size={[1.5, 3.5]} duration={[2.5, 6]} delay={[0, 6]}>
        {() => <div className="aspect-square w-full rounded-full bg-white" />}
      </Drift>

      {/* distant ringed planet + astronaut */}
      {step >= 1 ? (
        <>
          <Reveal anim="fade-in" duration={3000} className="pointer-events-none absolute left-[4%] top-[14%] w-[16cqmin] animate-float-slow">
            <div className="relative aspect-square rounded-full bg-[radial-gradient(circle_at_35%_30%,#ffd9a8,#c0703a_60%,#5b2a14)] shadow-[inset_-1cqmin_-1cqmin_2cqmin_rgba(0,0,0,0.5)]">
              <div className="absolute -inset-x-[36%] top-[36%] h-[24%] -rotate-[18deg] rounded-[50%] border-[0.7cqmin] border-[#ffd9a8]/70" style={{ borderBottomColor: 'transparent' }} />
            </div>
          </Reveal>
        </>
      ) : null}

      <div className="absolute inset-0 z-20 mx-auto flex h-full w-full max-w-[min(100cqw,74cqh)] flex-col items-center px-[5cqmin] pb-[14cqmin] pt-[10cqmin]" onPointerDown={tap}>
        {/* planet = avatar */}
        {step >= 2 ? (
          <Reveal anim="zoom-in" duration={2200} className="relative mt-[2cqmin]">
            <div className="absolute -inset-[3cqmin] rounded-full bg-[radial-gradient(circle,rgba(33,212,253,0.5),transparent_68%)] blur-md" />
            <div className="relative h-[min(46cqmin,27cqh)] w-[min(46cqmin,27cqh)] [perspective:90cqmin]">
              {/* rings */}
              <div className="absolute -inset-[16%] animate-spin-slow [transform-style:preserve-3d]" style={{ animationDuration: '30s' }}>
                <div className="absolute inset-0 rounded-full border-[0.5cqmin] border-white/35" style={{ transform: 'rotateX(72deg)' }} />
                <div className="absolute inset-[8%] rounded-full border-[0.3cqmin] border-cyan-300/40" style={{ transform: 'rotateX(72deg)' }} />
              </div>
              <div className="relative h-full w-full overflow-hidden rounded-full shadow-[0_0_5cqmin_rgba(33,212,253,0.55),inset_0_0_2cqmin_rgba(33,212,253,0.7)]">
                <Avatar className="h-full w-full" fallbackClassName="bg-gradient-to-br from-[#d76d77] via-[#3a1c71] to-[#21d4fd]" textClassName="font-script font-bold text-white" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_26%,rgba(255,255,255,0.35),transparent_42%,rgba(0,0,10,0.72)_92%)]" />
              </div>
              {/* moon with the age */}
              <div className="absolute inset-0 animate-spin-slow" style={{ animationDuration: '14s' }}>
                <div className="absolute -top-[11%] left-1/2 grid h-[24%] w-[24%] -translate-x-1/2 place-items-center rounded-full bg-gradient-to-br from-[#fff] to-[#9aa6c9] text-[#1b1464] shadow-[0_0_2cqmin_rgba(255,255,255,0.6)]" style={{ animation: 'spinSlow 14s linear infinite reverse' }}>
                  <span className="font-righteous text-[3.4cqmin] leading-none">{w.ageText || '★'}</span>
                </div>
              </div>
            </div>
          </Reveal>
        ) : (
          <div style={{ height: 'min(46cqmin,27cqh)', marginTop: '2cqmin' }} />
        )}

        <div className="mt-[4cqmin] text-center">
          {step >= 3 ? (
            <>
              <div style={{ fontSize: fitName(w.name, 14) }} className="leading-[1.1]">
                <SplitText text={w.name} stagger={70} anim="pop-in" className="font-script font-bold text-white [text-shadow:0_0_1.8cqmin_rgba(33,212,253,0.9)]" />
              </div>
              <Reveal anim="fade-in" delay={700} className="mt-[1.2cqmin] font-righteous text-[clamp(0.7rem,3cqmin,1.2rem)] tracking-[0.2em] text-cyan-200">
                {head.toUpperCase()}
              </Reveal>
              {sub ? <Reveal anim="fade-in" delay={1000} className="mt-[0.6cqmin] text-[clamp(0.65rem,2.6cqmin,1rem)] tracking-[0.12em] text-white/60">{sub}</Reveal> : null}
            </>
          ) : null}
        </div>

        {/* constellation */}
        {step >= 4 ? (
          <svg viewBox="0 0 100 40" className="mt-[3cqmin] w-[84cqmin] max-w-full" aria-hidden="true">
            <polyline points={CONSTELLATION.map((p) => p.join(',')).join(' ')} pathLength="1" fill="none" stroke="rgba(160,220,255,0.55)" strokeWidth="0.35" style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: 'draw 3s ease-out forwards' }} />
            {CONSTELLATION.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="1.1" fill="#fff" className="animate-twinkle" style={{ animationDelay: `${i * 0.3}s` }} />
            ))}
          </svg>
        ) : null}

        <div className="flex-1" />

        {step >= 5 ? (
          <Reveal anim="fade-up" className="relative w-full max-w-[92cqmin] overflow-hidden rounded-[2cqmin] border border-cyan-300/50 bg-[#06122b]/90 px-[4cqmin] py-[3cqmin] shadow-[0_0_3cqmin_rgba(33,212,253,0.25)]">
            <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_0.5cqmin,rgba(255,255,255,0.03)_0.5cqmin,rgba(255,255,255,0.03)_0.8cqmin)]" />
            <div className="font-righteous text-[clamp(0.55rem,2.2cqmin,0.85rem)] tracking-[0.18em] text-cyan-300">INCOMING TRANSMISSION · FROM {w.hasFrom ? w.from.toUpperCase() : 'EARTH'}</div>
            <p className="mt-[1.6cqmin] text-[clamp(0.78rem,3.2cqmin,1.2rem)] leading-snug text-white/90">
              <Typewriter text={w.message} speed={32} cursor />
            </p>
            {step >= 6 ? (
              <div className="mt-[2cqmin] border-t border-cyan-300/25 pt-[1.6cqmin] font-mono text-[clamp(0.6rem,2.4cqmin,0.9rem)] leading-relaxed text-cyan-100/80">
                <div className="text-cyan-300">MISSION LOG</div>
                {w.wishes.map((x, i) => (
                  <Reveal key={i} anim="fade-in" delay={i * 900}>
                    ▸ {x}
                  </Reveal>
                ))}
              </div>
            ) : null}
          </Reveal>
        ) : null}
      </div>
    </Stage>
  );
}
