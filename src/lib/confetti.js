// Dependency-free canvas confetti that lives INSIDE the active <Stage>, so it
// also works in the phone-frame preview (it never spills over the page).
//
//   import { confetti } from '../lib/confetti';
//   confetti.burst({ x: 0.5, y: 0.6 });       // x / y are 0..1 of the stage
//   confetti.cannons();                        // two corner cannons
//   confetti.rain({ duration: 5000 });         // gentle falling confetti
//   confetti.emoji(['🎉', '🎈', '✨']);         // emoji shower
//   confetti.clear();

import { isLite } from './quality';

const PALETTE = ['#ff4d8d', '#ffc83d', '#3ddcb4', '#8b7cff', '#4dc9ff', '#ff8a3d', '#ffffff'];

let root = null;
let canvas = null;
let g = null;
let parts = [];
let raf = 0;
let last = 0;
let dpr = 1;
let W = 0;
let H = 0;
const timers = new Set();

export function registerStage(el) {
  root = el;
}
export function unregisterStage(el) {
  if (root === el) {
    clear();
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    canvas = null;
    g = null;
    root = null;
  }
}

const reduced = () =>
  typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function ensure() {
  if (!root || typeof document === 'undefined') return false;
  if (!canvas || canvas.parentNode !== root) {
    canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.setAttribute('data-snap', 'top');
    canvas.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:50';
    root.appendChild(canvas);
    g = canvas.getContext('2d');
  }
  dpr = Math.min(isLite() ? 1 : 1.5, window.devicePixelRatio || 1);
  W = root.clientWidth;
  H = root.clientHeight;
  if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }
  return true;
}

const sprites = new Map();
function emojiSprite(ch, px) {
  const key = ch + '|' + px;
  let c = sprites.get(key);
  if (!c) {
    c = document.createElement('canvas');
    const s = Math.ceil(px * 1.5);
    c.width = s;
    c.height = s;
    const x = c.getContext('2d');
    x.font = `${px}px serif`;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText(ch, s / 2, s / 2);
    sprites.set(key, c);
  }
  return c;
}

function star(ctx, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 ? r * 0.45 : r;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fill();
}

function spawn(o = {}) {
  if (!ensure()) return;
  const {
    x = 0.5,
    y = 0.5,
    count = 90,
    angle = -90,
    spread = 70,
    power = 1,
    gravity = 1,
    size = 1,
    colors = PALETTE,
    shapes = ['rect', 'circle', 'ribbon', 'star'],
    emojis = null,
    ttl = 3.2,
  } = o;
  const scale = Math.min(1.4, Math.max(0.6, Math.min(W, H) / 700));
  const n = reduced() ? Math.ceil(count * 0.3) : isLite() ? Math.ceil(count * 0.55) : count;
  for (let i = 0; i < n; i++) {
    const a = ((angle + (Math.random() - 0.5) * spread) * Math.PI) / 180;
    const v = (380 + Math.random() * 720) * power * scale;
    const shape = emojis ? 'emoji' : shapes[Math.floor(Math.random() * shapes.length)];
    parts.push({
      x: x * W,
      y: y * H,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      g: 900 * gravity * scale,
      w: (6 + Math.random() * 7) * size * scale,
      h: (9 + Math.random() * 9) * size * scale,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 12,
      flip: Math.random() * Math.PI * 2,
      vf: 4 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape,
      emoji: emojis ? emojis[Math.floor(Math.random() * emojis.length)] : '',
      age: 0,
      ttl: ttl * (0.7 + Math.random() * 0.6),
    });
  }
  if (!raf) {
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
}

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!g || !root) {
    raf = 0;
    return;
  }
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, W, H);
  const drag = Math.pow(0.3, dt);
  parts = parts.filter((p) => {
    p.age += dt;
    p.vx *= drag;
    p.vy = p.vy * drag + p.g * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += p.vr * dt;
    p.flip += p.vf * dt;
    if (p.age > p.ttl || p.y > H + 60) return false;
    const fade = Math.min(1, (p.ttl - p.age) / 0.7);
    g.save();
    g.globalAlpha = Math.max(0, fade);
    g.translate(p.x, p.y);
    g.rotate(p.rot);
    g.fillStyle = p.color;
    switch (p.shape) {
      case 'circle':
        g.beginPath();
        g.arc(0, 0, p.w * 0.5, 0, Math.PI * 2);
        g.fill();
        break;
      case 'star':
        star(g, p.w * 0.9);
        break;
      case 'ribbon':
        g.scale(1, Math.cos(p.flip));
        g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        break;
      case 'emoji':
        {
          const px = Math.max(10, Math.round(p.h * 2.2 / 4) * 4);
          const sp = emojiSprite(p.emoji, px);
          g.drawImage(sp, -sp.width / 2, -sp.height / 2);
        }
        break;
      default:
        g.scale(1, Math.abs(Math.cos(p.flip)) * 0.8 + 0.2);
        g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * 0.6);
    }
    g.restore();
    return true;
  });
  if (parts.length) raf = requestAnimationFrame(frame);
  else {
    raf = 0;
    g.clearRect(0, 0, W, H);
  }
}

function later(fn, ms) {
  const id = setTimeout(() => {
    timers.delete(id);
    fn();
  }, ms);
  timers.add(id);
}

export function clear() {
  timers.forEach(clearTimeout);
  timers.clear();
  parts = [];
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
  if (g && canvas) g.clearRect(0, 0, canvas.width, canvas.height);
}

export const confetti = {
  burst: spawn,
  /** two cannons firing inward from the bottom corners */
  cannons(o = {}) {
    spawn({ x: 0.02, y: 1.02, angle: -58, spread: 40, count: 70, power: 1.35, ...o });
    spawn({ x: 0.98, y: 1.02, angle: -122, spread: 40, count: 70, power: 1.35, ...o });
    later(() => {
      spawn({ x: 0.02, y: 1.02, angle: -62, spread: 50, count: 50, power: 1.1, ...o });
      spawn({ x: 0.98, y: 1.02, angle: -118, spread: 50, count: 50, power: 1.1, ...o });
    }, 260);
  },
  /** gentle shower from the top for `duration` ms */
  rain({ duration = 4500, colors, emojis } = {}) {
    const end = performance.now() + duration;
    const tick = () => {
      if (performance.now() > end) return;
      spawn({ x: Math.random(), y: -0.04, angle: 90, spread: 30, count: 4, power: 0.18, gravity: 0.35, ttl: 6, colors, emojis });
      later(tick, 90);
    };
    tick();
  },
  emoji(emojis = ['🎉', '🎈', '✨', '🎂'], o = {}) {
    spawn({ x: 0.5, y: 1.02, angle: -90, spread: 70, count: 26, power: 1.3, emojis, ...o });
  },
  stars(o = {}) {
    spawn({ x: 0.5, y: 0.45, angle: -90, spread: 360, count: 60, power: 0.9, gravity: 0.5, shapes: ['star'], colors: ['#ffc83d', '#fff3b0', '#ffffff'], ...o });
  },
  later,
  clear,
};
