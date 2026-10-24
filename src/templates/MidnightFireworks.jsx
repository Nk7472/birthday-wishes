import { useMemo } from 'react';
import Avatar from '../components/shared/Avatar';
import CanvasLayer from '../components/shared/CanvasLayer';
import Drift from '../components/shared/Drift';
import { useTimeline } from '../components/shared/hooks';
import Reveal from '../components/shared/Reveal';
import SplitText from '../components/shared/SplitText';
import Stage from '../components/shared/Stage';
import { useWish } from '../components/shared/WishContext';
import { sfx } from '../lib/audio';
import { fitName } from '../lib/fit';
import { isLite } from '../lib/quality';
import { between, makeList } from '../lib/rng';

const PALETTES = [
  ['#ffd36b', '#fff1b8', '#ffb347'],
  ['#ff5da8', '#ffb3d9', '#ff2e7e'],
  ['#4de1ff', '#b8f4ff', '#2aa8ff'],
  ['#a58bff', '#e0d6ff', '#7650ff'],
  ['#7dffb2', '#d0ffe3', '#34d480'],
  ['#ffffff', '#ffe9c2', '#ffd36b'],
];
const KINDS = ['peony', 'peony', 'ring', 'heart', 'star', 'willow'];
const rnd = (a, b) => a + Math.random() * (b - a);

/* ---------------- firework engine (pure canvas, lives in CanvasLayer state) ---------------- */

function launch(s, xFrac, yFrac, kind) {
  const x = xFrac * s.w;
  s.rockets.push({
    sx: x + rnd(-10, 10),
    x,
    y: s.h,
    tx: x,
    ty: yFrac * s.h,
    age: 0,
    dur: rnd(0.85, 1.25),
    kind: kind || KINDS[Math.floor(Math.random() * KINDS.length)],
    pal: PALETTES[Math.floor(Math.random() * PALETTES.length)],
  });
}

function explode(s, r, t) {
  const R = Math.min(s.w, s.h * 1.05) * 0.36;
  const v0 = R * 2.1;
  const add = (angle, speed, extra = {}) =>
    s.sparks.push({
      x: r.tx,
      y: r.ty,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      age: 0,
      ttl: rnd(1.3, 2.1),
      color: r.pal[Math.floor(Math.random() * 3)],
      size: rnd(1.2, 2.2),
      drag: 0.12,
      grav: 90,
      ph: Math.random() * 6.28,
      ...extra,
    });
  switch (r.kind) {
    case 'ring':
      for (let i = 0; i < 64; i++) add((i / 64) * 6.283, v0 * 0.95, { ttl: 1.6 });
      break;
    case 'heart':
      for (let i = 0; i < 70; i++) {
        const a = (i / 70) * 6.283;
        const hx = 16 * Math.sin(a) ** 3;
        const hy = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
        const k = v0 / 17;
        s.sparks.push({ x: r.tx, y: r.ty, vx: hx * k, vy: hy * k, age: 0, ttl: 1.8, color: '#ff5da8', size: 2, drag: 0.12, grav: 60, ph: i });
      }
      break;
    case 'star':
      for (let i = 0; i < 80; i++) {
        const a = (i / 80) * 6.283;
        add(a, v0 * (0.45 + 0.55 * Math.abs(Math.cos(2.5 * a))), { ttl: 1.7 });
      }
      break;
    case 'willow':
      for (let i = 0; i < 90; i++) add(rnd(0, 6.283), rnd(0.25, 0.85) * v0, { color: i % 3 ? '#ffd36b' : '#fff1b8', ttl: rnd(2.2, 3.4), drag: 0.35, grav: 140, size: 1.5 });
      break;
    default:
      for (let i = 0; i < 110; i++) add(rnd(0, 6.283), Math.sqrt(Math.random()) * v0);
  }
  if (t - s.lastBoom > 0.3) {
    r.kind === 'willow' ? sfx.crackle() : sfx.boom();
    s.lastBoom = t;
  }
}

function setup({ w, h }) {
  return { w, h, rockets: [], sparks: [], queue: [], lastBoom: -9, lastFinale: 0, next: 99, seq: 0 };
}

function draw({ ctx, w, h, t, dt, state: s }) {
  s.w = w;
  s.h = h;

  // script: a lone rocket, a salvo, then a relaxed cadence with a finale every ~15s
  if (s.seq === 0 && t > 0.9) {
    launch(s, 0.5, 0.3, 'peony');
    s.seq = 1;
  } else if (s.seq === 1 && t > 3.3) {
    [0.22, 0.78, 0.5].forEach((x, i) => s.queue.push({ at: t + i * 0.28, x, y: rnd(0.18, 0.36) }));
    s.seq = 2;
    s.next = t + 2;
    s.lastFinale = t;
  } else if (s.seq === 2 && t > s.next) {
    if (t - s.lastFinale > 15) {
      for (let i = 0; i < 7; i++) s.queue.push({ at: t + i * 0.2, x: 0.12 + i * 0.12, y: rnd(0.14, 0.4) });
      s.lastFinale = t;
      s.next = t + 4;
    } else {
      launch(s, rnd(0.12, 0.88), rnd(0.12, 0.5));
      s.next = t + rnd(1.0, 2.1);
    }
  }
  s.queue = s.queue.filter((q) => {
    if (t < q.at) return true;
    launch(s, q.x, q.y);
    return false;
  });

  // fade previous frame -> glowing trails
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = `rgba(0,0,0,${Math.min(0.5, dt * 9)})`;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'lighter';

  s.rockets = s.rockets.filter((r) => {
    r.age += dt;
    const u = Math.min(1, r.age / r.dur);
    const e = 1 - (1 - u) * (1 - u);
    r.x = r.sx + (r.tx - r.sx) * e + Math.sin(r.age * 22) * 1.2;
    r.y = h + (r.ty - h) * e;
    ctx.fillStyle = '#fff3d0';
    ctx.beginPath();
    ctx.arc(r.x, r.y, 2.2, 0, 6.283);
    ctx.fill();
    if (u >= 1) {
      explode(s, r, t);
      return false;
    }
    return true;
  });

  const cap = isLite() ? 320 : 560;
  if (s.sparks.length > cap) s.sparks.splice(0, s.sparks.length - cap);
  s.sparks = s.sparks.filter((p) => {
    p.age += dt;
    if (p.age > p.ttl) return false;
    const k = Math.pow(p.drag, dt);
    p.vx *= k;
    p.vy = p.vy * k + p.grav * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    const life = 1 - p.age / p.ttl;
    const tw = life < 0.5 ? 0.55 + 0.45 * Math.sin(p.age * 38 + p.ph) : 1;
    ctx.globalAlpha = Math.max(0, life) * tw;
    ctx.fillStyle = p.color;
    const sz = p.size * (0.6 + life * 0.6) * 1.7;
    ctx.fillRect(p.x - sz / 2, p.y - sz / 2, sz, sz);
    return true;
  });
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

function onTap({ x, y, state: s, h }) {
  s.rockets.push({
    sx: x + rnd(-30, 30),
    x: 0,
    y: h,
    tx: x,
    ty: y,
    age: 0,
    dur: 0.7,
    kind: KINDS[Math.floor(Math.random() * KINDS.length)],
    pal: PALETTES[Math.floor(Math.random() * PALETTES.length)],
  });
}

/* ---------------- skyline ---------------- */

function Skyline() {
  const layers = useMemo(
    () =>
      [
        { seed: 3, fill: '#140f3d', base: 52, hmin: 14, hmax: 40, win: 0 },
        { seed: 9, fill: '#0b0829', base: 66, hmin: 10, hmax: 34, win: 22 },
      ].map((L) => {
        const blds = [];
        let x = -4;
        const r = makeList(40, L.seed, (rng) => ({ w: between(rng, 14, 30), h: between(rng, L.hmin, L.hmax), a: rng() }));
        for (const b of r) {
          if (x > 404) break;
          blds.push({ x, ...b });
          x += b.w + 1.2;
        }
        const wins = L.win
          ? makeList(L.win, L.seed + 1, (rng) => {
              const b = blds[Math.floor(rng() * blds.length)];
              return { x: b.x + 3 + rng() * Math.max(2, b.w - 7), y: 100 - b.h + 4 + rng() * Math.max(2, b.h - 10), d: rng() * 4 };
            })
          : [];
        return { ...L, blds, wins };
      }),
    [],
  );
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[20cqh]" aria-hidden="true">
      <svg viewBox="0 0 400 100" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full">
        {layers.map((L, li) => (
          <g key={li} fill={L.fill}>
            {L.blds.map((b, i) => (
              <rect key={i} x={b.x} y={100 - b.h} width={b.w} height={b.h + 4} />
            ))}
            {L.wins.map((wn, i) => (
              <rect key={`w${i}`} x={wn.x} y={wn.y} width="2.4" height="3" fill="#ffd98a" className="animate-twinkle" style={{ animationDelay: `${wn.d}s`, animationDuration: `${3 + wn.d}s` }} />
            ))}
          </g>
        ))}
        <rect x="0" y="92" width="400" height="8" fill="#050818" />
        <rect x="0" y="92" width="400" height="1" fill="#3b2f8a" opacity="0.7" />
      </svg>
    </div>
  );
}

export default function MidnightFireworks() {
  const w = useWish();
  const step = useTimeline([3600, 4400, 6800]);
  const head = w.ordinal ? `Happy ${w.ordinal} Birthday` : 'Happy Birthday';

  return (
    <Stage className="bg-[linear-gradient(to_bottom,#040616_0%,#0b0f3a_42%,#2a1666_78%,#5a2b7e_100%)] text-white">
      <Drift count={46} seed={5} anim="twinkle" size={[2, 5]} duration={[2.5, 6]} delay={[0, 6]} y={[0, 62]} colors={['#ffffff', '#cfe0ff', '#fff1c9']}>
        {(p) => <div className="aspect-square w-full rounded-full" style={{ background: p.color }} />}
      </Drift>

      <CanvasLayer className="absolute inset-0 z-10" setup={setup} draw={draw} onTap={onTap} />
      <Skyline />

      <div className="pointer-events-none absolute inset-0 z-30 mx-auto flex h-full w-full max-w-[min(100cqw,76cqh)] flex-col items-center px-[5cqmin] pb-[19cqh] pt-[10cqmin]">
        {step >= 1 ? (
          <Reveal anim="zoom-in" duration={1800} className="relative">
            <div className="absolute -inset-[8cqmin] animate-pulse rounded-full bg-[radial-gradient(circle,rgba(255,226,150,0.5),transparent_66%)]" />
            <div className="relative rounded-full bg-gradient-to-b from-[#fff3c4] via-[#ffd36b] to-[#b9822a] p-[0.9cqmin] shadow-[0_0_6cqmin_rgba(255,211,107,0.55)]">
              <Avatar className="h-[min(30cqmin,20cqh)] w-[min(30cqmin,20cqh)]" />
            </div>
          </Reveal>
        ) : (
          <div style={{ height: 'min(30cqmin,20cqh)' }} />
        )}

        <div className="mt-[3cqmin] flex min-h-[22cqmin] flex-col items-center text-center">
          {step >= 2 ? (
            <>
              <div style={{ fontSize: fitName(w.name, 15) }} className="leading-[1.1]">
                <SplitText
                  text={w.name}
                  delay={100}
                  stagger={70}
                  anim="pop-in"
                  className="font-script font-bold"
                  letterClassName="bg-gradient-to-b from-[#fff6cf] via-[#ffd36b] to-[#e0982b] bg-clip-text text-transparent drop-shadow-[0_0_1.6cqmin_rgba(255,190,80,0.55)]"
                />
              </div>
              <Reveal anim="fade-in" delay={900} className="mt-[1cqmin] font-cinzel text-[clamp(0.8rem,3.4cqmin,1.35rem)] font-bold tracking-[0.22em] text-[#ffe9b0]">
                {head.toUpperCase()}
              </Reveal>
            </>
          ) : null}
        </div>

        <div className="relative mt-[2cqmin] h-[8cqmin] w-full">
          {step >= 2
            ? w.wishes.map((wish, i) => (
                <p
                  key={i}
                  className="absolute inset-x-0 top-0 text-center font-playfair text-[clamp(0.85rem,3.6cqmin,1.4rem)] italic text-[#cfd9ff]"
                  style={{ opacity: 0, animation: 'wishCycle 18s ease-in-out infinite', animationDelay: `${i * 6 + 1.2}s` }}
                >
                  {wish}
                </p>
              ))
            : null}
        </div>

        <div className="flex-1" />

        {step >= 3 ? (
          <Reveal anim="fade-up" className="w-full max-w-[92cqmin] rounded-[3cqmin] border border-[#ffd36b]/45 bg-[#0a0d33]/88 px-[5cqmin] py-[3.6cqmin] text-center shadow-[0_0_5cqmin_rgba(120,90,255,0.25)]">
            <p className="text-[clamp(0.82rem,3.4cqmin,1.3rem)] leading-snug text-white/90">{w.message}</p>
            {w.hasFrom ? <p className="mt-[1.8cqmin] font-script text-[clamp(1.1rem,4.8cqmin,1.9rem)] font-bold text-[#ffd36b]">With love, {w.from}</p> : null}
          </Reveal>
        ) : null}
      </div>
    </Stage>
  );
}
