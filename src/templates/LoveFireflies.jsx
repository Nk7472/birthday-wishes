import { useEffect, useRef } from 'react';
import Avatar from '../components/shared/Avatar';
import Board from '../components/shared/Board';
import CanvasLayer from '../components/shared/CanvasLayer';
import { useTimeline } from '../components/shared/hooks';
import Reveal from '../components/shared/Reveal';
import SplitText from '../components/shared/SplitText';
import Stage from '../components/shared/Stage';
import Typewriter from '../components/shared/Typewriter';
import { useWish } from '../components/shared/WishContext';
import { sfx } from '../lib/audio';
import { isLite } from '../lib/quality';
import { fitName } from '../lib/fit';
import { heartPoints, msgSize, togetherText } from '../lib/love';

const ease = (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);

function makeSprite() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,250,200,1)');
  grd.addColorStop(0.18, 'rgba(255,230,130,0.95)');
  grd.addColorStop(0.5, 'rgba(255,200,80,0.28)');
  grd.addColorStop(1, 'rgba(255,200,80,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  return c;
}

export default function LoveFireflies() {
  const w = useWish();
  const step = useTimeline([400, 6200, 9000, 12500]);
  const gather = useRef(0); // seconds at which the heart forms (set once)
  const attract = useRef(null);
  const together = togetherText(w);

  useEffect(() => {
    if (step === 2) {
      gather.current = performance.now();
      sfx.sparkle();
    }
    if (step === 3) sfx.chime(880);
  }, [step]);

  const setup = ({ w: W, h: H }) => {
    const n = isLite() ? 26 : 44;
    const hp = heartPoints(n);
    return {
      sprite: makeSprite(),
      flies: Array.from({ length: n }, (_, i) => ({
        x: Math.random() * W,
        y: H * (0.25 + Math.random() * 0.65),
        a: Math.random() * Math.PI * 2,
        sp: 10 + Math.random() * 18,
        ph: Math.random() * 6.28,
        r: 14 + Math.random() * 16,
        tx: W * (0.5 + (hp[i].x - 0.5) * 0.7),
        ty: H * (0.17 + hp[i].y * 0.34),
      })),
    };
  };

  const draw = ({ ctx, w: W, h: H, t, dt, state }) => {
    ctx.clearRect(0, 0, W, H);
    const k = gather.current ? Math.min(1, (performance.now() - gather.current) / 3200) : 0;
    const m = ease(k);
    const beat = 1 + 0.08 * Math.sin(t * 5) * m;
    ctx.globalCompositeOperation = 'lighter';
    state.flies.forEach((f) => {
      f.a += Math.sin(t * 0.7 + f.ph) * dt * 2;
      f.x += Math.cos(f.a) * f.sp * dt;
      f.y += Math.sin(f.a) * f.sp * dt * 0.6;
      if (f.x < -20) f.x = W + 20;
      if (f.x > W + 20) f.x = -20;
      if (f.y < H * 0.12) f.y = H * 0.12 + 2, (f.a = Math.abs(f.a));
      if (f.y > H * 0.96) f.y = H * 0.96 - 2, (f.a = -Math.abs(f.a));
      const cx = W / 2;
      const cy = H * 0.34;
      const hx = cx + (f.tx - cx) * beat;
      const hy = cy + (f.ty - cy) * beat;
      const x = f.x + (hx - f.x) * m + Math.sin(t * 2 + f.ph) * 2 * (1 - m * 0.6);
      const y = f.y + (hy - f.y) * m + Math.cos(t * 2.3 + f.ph) * 2 * (1 - m * 0.6);
      const glow = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 2.2 + f.ph * 3));
      const s = f.r * (1 + 0.5 * m);
      ctx.globalAlpha = Math.min(1, glow + m * 0.4);
      ctx.drawImage(state.sprite, x - s, y - s, s * 2, s * 2);
    });
    if (attract.current) attract.current = null;
  };

  const tap = () => {
    sfx.sparkle();
  };

  return (
    <Stage className="bg-[#06141a] text-white">
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #050e1f 0%, #0b2a35 55%, #123b2f 100%)' }} />
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-0 h-[24%] w-full" aria-hidden="true">
        <path d="M0 40 V22 C10 18 16 24 26 20 C38 15 44 24 56 19 C68 14 76 23 88 18 C94 16 98 19 100 18 V40 Z" fill="#0a2a22" />
        <path d="M0 40 V30 C12 26 22 32 36 28 C50 24 62 32 76 28 C88 25 94 29 100 27 V40 Z" fill="#06180f" />
      </svg>
      <CanvasLayer setup={setup} draw={draw} />

      <Board className="pointer-events-none">
        {step >= 2 ? (
          <Reveal anim="zoom-in" className="absolute left-1/2 top-[24.5%] -translate-x-1/2">
            <Avatar className="h-[24cqw] w-[24cqw] border-[0.8cqw] border-[#ffe8a0]" fallbackClassName="bg-[#18574a]" textClassName="font-script font-bold text-[#ffe8a0]" style={{ boxShadow: '0 0 7cqw rgba(255,220,120,0.7)' }} />
          </Reveal>
        ) : null}

        {step >= 1 ? (
          <div className="absolute inset-x-[5cqw] top-[6%] text-center">
            <Reveal><p className="font-hand text-[5cqw] text-[#ffe8a0]/90">a little light for</p></Reveal>
            <p className="font-script leading-none text-[#fff4c9]" style={{ fontSize: fitName(w.name, 14, { width: 80 }), textShadow: '0 0 5cqw rgba(255,210,90,0.8)' }}>
              <SplitText text={w.name} delay={500} stagger={80} anim="fade-up" />
            </p>
          </div>
        ) : null}

        {step >= 3 ? (
          <Reveal className="absolute inset-x-[7cqw] top-[63%]">
            <div className="rounded-[4cqw] border border-[#ffe8a0]/25 bg-[#071d22]/90 px-[5cqw] py-[3.4cqw] text-center shadow-[0_0_8cqw_rgba(255,210,90,0.2)]">
              {together ? <p className="mb-[1.6cqw] font-hand text-[5cqw] text-[#ffe8a0]">{together}</p> : null}
              <p className="font-hand leading-[1.3] text-[#fff8dc]" style={{ fontSize: `${msgSize(w.message, 5.2, 3.8)}cqw` }}>
                <Typewriter text={w.message} speed={30} cursor={false} />
              </p>
              {w.hasFrom ? <p className="mt-[1.6cqw] font-script text-[6.4cqw] leading-none text-[#ffd36b]">— {w.from}</p> : null}
            </div>
          </Reveal>
        ) : null}
      </Board>
      <div className="absolute inset-0" onPointerDown={tap} />
    </Stage>
  );
}
