import { useCallback, useEffect, useRef, useState } from 'react';
import { useCountUp, useTimeline } from '../components/shared/hooks';
import Stage from '../components/shared/Stage';
import Typewriter from '../components/shared/Typewriter';
import { useWish } from '../components/shared/WishContext';
import { sfx } from '../lib/audio';
import { confetti } from '../lib/confetti';

const INK = '#1d1b4a';
const MINT = '#00e5a8';
const YELLOW = '#ffd23f';
const PINK = '#ff5d8f';
const px = { fontFamily: "'Press Start 2P', monospace" };

/* ---------- pixel art helpers ---------- */

/** Draws a pixel sprite from rows of palette characters. */
function Sprite({ rows, palette, className = '', style }) {
  const h = rows.length;
  const w = rows[0].length;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} shapeRendering="crispEdges" className={className} style={style} aria-hidden="true">
      {rows.map((row, y) =>
        [...row].map((c, x) => (palette[c] ? <rect key={`${x}-${y}`} x={x} y={y} width="1.02" height="1.02" fill={palette[c]} /> : null)),
      )}
    </svg>
  );
}

const COIN = ['..yyyy..', '.yYYYYy.', 'yYYooYYy', 'yYYooYYy', 'yYYooYYy', 'yYYooYYy', '.yYYYYy.', '..yyyy..'];
const COIN_PAL = { y: '#c98a00', Y: YELLOW, o: '#fff3a0' };
const HEART = ['.rr.rr.', 'rRRrRRr', 'rRRRRRr', 'rRRRRRr', '.rRRRr.', '..rRr..', '...r...'];
const HEART_PAL = { r: '#b3123f', R: PINK };
const CAKE = [
  '......f.......', '......o.......', '......c.......', '...ppppppp....', '..pwwwwwwwp...', '..pppppppppp..',
  '.ccccccccccc..', '.cwcwcwcwcwc..', '.ccccccccccc..', 'bbbbbbbbbbbbb.', 'bBbBbBbBbBbBb.', 'bbbbbbbbbbbbb.',
];
const CAKE_PAL = { f: YELLOW, o: '#ff8a1f', c: '#fff', p: PINK, w: '#ffd2e0', b: '#8a5a3b', B: '#a8734d' };
const CLOUD = ['....wwww....', '..wwwwwwww..', '.wwwwwwwwwww', 'wwwwwwwwwwww', '.wwwwwwwwww.'];
const CLOUD_PAL = { w: '#ffffffcc' };
const TROPHY = ['yyyyyyy', 'yYYYYYy', 'yYYYYYy', '.yYYYy.', '..yYy..', '..yyy..', '.yyyyy.'];

/** The friend's photo for real-pixelated: 20x20 canvas, 4-level colour. */
function PixelPhoto({ className = '' }) {
  const w = useWish();
  const ref = useRef(null);
  useEffect(() => {
    if (!w.hasPhoto) return undefined;
    const img = new Image();
    let dead = false;
    img.onload = () => {
      if (dead || !ref.current) return;
      const c = ref.current;
      const g = c.getContext('2d', { willReadFrequently: true });
      g.imageSmoothingEnabled = true;
      g.drawImage(img, 0, 0, 20, 20);
      const d = g.getImageData(0, 0, 20, 20);
      for (let i = 0; i < d.data.length; i += 4) for (let k = 0; k < 3; k++) d.data[i + k] = Math.round(d.data[i + k] / 64) * 64;
      g.putImageData(d, 0, 0);
    };
    img.src = w.photo;
    return () => {
      dead = true;
    };
  }, [w.photo, w.hasPhoto]);
  if (!w.hasPhoto) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ background: MINT, ...px, color: INK, fontSize: '9cqmin' }}>
        {w.initials}
      </div>
    );
  }
  return <canvas ref={ref} width="20" height="20" className={className} style={{ imageRendering: 'pixelated' }} />;
}

const pad = (n, l = 6) => String(n).padStart(l, '0');

export default function PixelArcade() {
  const w = useWish();
  const step = useTimeline([200, 1500, 2300, 5200, 8200, 11200, 14000, 17000]);
  const lvlTarget = w.age || 0;
  const lvl = useCountUp(lvlTarget || 1, { duration: Math.min(3000, 900 + lvlTarget * 55), delay: 0, active: step >= 3 });
  const levelDone = step >= 3 && (lvlTarget ? lvl >= lvlTarget : true);
  const [collected, setCollected] = useState(0);
  const [pops, setPops] = useState([]);
  const [hop, setHop] = useState(0);
  const [coins, setCoins] = useState(() => [0, 1, 2, 3, 4].map((i) => ({ id: i, x: 14 + i * 18, y: 18 + ((i * 37) % 46) })));
  const nextId = useRef(10);
  const lastTick = useRef(0);

  // boot sounds
  useEffect(() => {
    if (step === 1) sfx.coin();
    if (step === 2) sfx.coin();
    if ([5, 6, 7].includes(step)) sfx.coin();
  }, [step]);
  // level counting ticks
  useEffect(() => {
    if (step >= 3 && lvl > lastTick.current && lvl % 2 === 0) sfx.tick();
    lastTick.current = lvl;
  }, [lvl, step]);
  // level up explosion
  const exploded = useRef(false);
  useEffect(() => {
    if (levelDone && !exploded.current) {
      exploded.current = true;
      sfx.tada();
      confetti.burst({ x: 0.5, y: 0.3, count: 90, spread: 360, power: 0.9, gravity: 0.9, shapes: ['rect'], size: 1.2, colors: [MINT, YELLOW, PINK, '#fff'] });
    }
  }, [levelDone]);
  // coins respawn slowly
  useEffect(() => {
    if (step < 3) return undefined;
    const iv = setInterval(() => {
      setCoins((cs) => (cs.length >= 6 ? cs : [...cs, { id: nextId.current++, x: 8 + Math.random() * 80, y: 10 + Math.random() * 50 }]));
    }, 3200);
    return () => clearInterval(iv);
  }, [step]);

  const grab = useCallback((c, e) => {
    e.stopPropagation();
    sfx.coin();
    setCoins((cs) => cs.filter((x) => x.id !== c.id));
    setCollected((n) => n + 1);
    const id = nextId.current++;
    setPops((p) => [...p, { id, x: c.x, y: c.y }]);
    setTimeout(() => setPops((p) => p.filter((q) => q.id !== id)), 900);
    confetti.burst({ x: c.x / 100, y: 0.3 + c.y / 160, count: 14, spread: 360, power: 0.35, gravity: 0.5, shapes: ['rect'], size: 0.7, colors: [YELLOW, '#fff3a0'] });
  }, []);

  const jump = () => {
    setHop((h) => h + 1);
    sfx.pop();
  };

  const score = (levelDone ? lvlTarget * 100 : lvl * 100) + collected * 100;
  const achievements = w.wishes.slice(0, 3);

  return (
    <Stage className="select-none text-white" style={{ background: `linear-gradient(to bottom, ${INK} 0%, #2b2a6e 55%, #3a3a8c 100%)`, ...px }}>
      {/* stars */}
      <div className="absolute inset-x-0 top-0 h-[60%] opacity-70" style={{ backgroundImage: 'radial-gradient(#fff 0.3cqmin, transparent 0.4cqmin)', backgroundSize: '9cqmin 7cqmin' }} />
      {/* clouds */}
      {[
        { top: 22, dur: 38, delay: -4, s: 20 },
        { top: 34, dur: 52, delay: -30, s: 14 },
        { top: 14, dur: 44, delay: -16, s: 16 },
      ].map((c, i) => (
        <div key={i} className="pointer-events-none absolute left-0" style={{ top: `${c.top}%`, width: `${c.s}cqmin`, animation: `driftX ${c.dur}s linear infinite`, animationDelay: `${c.delay}s` }}>
          <Sprite rows={CLOUD} palette={CLOUD_PAL} className="w-full" />
        </div>
      ))}

      <div className="absolute inset-0 z-10 mx-auto flex h-full w-full max-w-[min(100cqw,72cqh)] flex-col" onPointerDown={step >= 4 ? jump : undefined}>
        {/* HUD */}
        <div className="flex items-start justify-between px-[4cqmin] pt-[min(13cqmin,3.6rem)] text-[clamp(0.45rem,2.5cqmin,0.8rem)] leading-[1.7]">
          <div>
            <div style={{ color: PINK }}>SCORE</div>
            <div>{pad(step >= 3 ? score : 0)}</div>
          </div>
          <div className="text-center">
            <div style={{ color: YELLOW }}>HI-SCORE</div>
            <div>{pad(Math.max(99900, score))}</div>
          </div>
          <div className="text-right">
            <div style={{ color: MINT }}>LIVES</div>
            <div className="mt-[0.6cqmin] flex justify-end gap-[0.8cqmin]">
              {[0, 1, 2].map((i) => (
                <Sprite key={i} rows={HEART} palette={HEART_PAL} className="h-[3cqmin] w-[3cqmin]" />
              ))}
            </div>
          </div>
        </div>

        {/* boot */}
        {step < 3 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-[5cqmin] text-center">
            <div className="text-[clamp(0.9rem,5.4cqmin,2rem)]" style={{ color: YELLOW, textShadow: `0.6cqmin 0.6cqmin 0 #b3123f` }}>
              {step >= 2 ? 'PRESS START' : 'INSERT COIN'}
            </div>
            <div className="animate-[blink_0.8s_steps(1)_infinite] text-[clamp(0.5rem,2.6cqmin,0.9rem)]" style={{ color: MINT }}>
              {step >= 2 ? 'PLAYER 1 READY' : '1 CREDIT'}
            </div>
          </div>
        ) : (
          <div className="relative flex min-h-0 flex-1 flex-col items-center">
            {/* level counter + banner */}
            <div className="mt-[3cqmin] text-center">
              <div className="text-[clamp(0.55rem,2.8cqmin,1rem)]" style={{ color: MINT }}>
                {lvlTarget ? `LEVEL ${String(lvl).padStart(2, '0')}` : 'NEW LEVEL'}
              </div>
              {levelDone ? (
                <div className="mt-[1.4cqmin] animate-pop-in">
                  <div className="animate-[blink_0.9s_steps(1)_infinite] text-[clamp(1rem,6.2cqmin,2.4rem)]" style={{ color: YELLOW, textShadow: `0.7cqmin 0.7cqmin 0 #b3123f` }}>
                    LEVEL UP!
                  </div>
                  {!lvlTarget ? <div className="mt-[1.2cqmin] text-[clamp(0.45rem,2.4cqmin,0.8rem)]" style={{ color: PINK }}>NEW YEAR UNLOCKED</div> : null}
                </div>
              ) : (
                <div style={{ height: 'clamp(1.6rem,8cqmin,3rem)' }} />
              )}
            </div>

            {/* player + cake */}
            <div className="relative mt-[3cqmin] flex w-full items-end justify-center gap-[6cqmin]">
              <div key={hop} className="flex flex-col items-center" style={{ animation: hop ? 'bounceSoft 0.5s ease-out 1' : 'bobStep 0.9s steps(2) infinite' }}>
                <div className="relative h-[min(30cqmin,17cqh)] w-[min(30cqmin,17cqh)] border-[1.2cqmin] border-white bg-black" style={{ boxShadow: `0 0 0 1cqmin ${MINT}, 1.4cqmin 1.4cqmin 0 1cqmin #000` }}>
                  <PixelPhoto className="h-full w-full object-cover" />
                </div>
                <div className="mt-[3cqmin] text-[clamp(0.45rem,2.5cqmin,0.8rem)]" style={{ color: YELLOW }}>
                  P1 {w.name.slice(0, 12).toUpperCase()}
                </div>
              </div>
              <div className="relative w-[min(26cqmin,15cqh)]">
                <Sprite rows={CAKE} palette={CAKE_PAL} className="w-full" />
                <div className="absolute left-[41%] top-0 h-[8%] w-[9%] animate-[blink_0.5s_steps(1)_infinite]" style={{ background: '#fff3a0' }} />
              </div>
            </div>

            {/* achievements */}
            <div className="mt-[4cqmin] flex w-full flex-col gap-[1.6cqmin] px-[4cqmin]">
              {achievements.map((a, i) =>
                step >= 5 + i ? (
                  <div key={i} className="flex items-center gap-[2.4cqmin] border-[0.8cqmin] border-white bg-black/70 px-[2.4cqmin] py-[1.6cqmin]" style={{ animation: 'toastIn 0.5s steps(8,end) both', boxShadow: `0.8cqmin 0.8cqmin 0 #000` }}>
                    <Sprite rows={TROPHY} palette={{ y: '#c98a00', Y: YELLOW }} className="h-[5cqmin] w-[5cqmin] shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[clamp(0.38rem,1.9cqmin,0.6rem)]" style={{ color: MINT }}>ACHIEVEMENT UNLOCKED</div>
                      <div className="mt-[0.8cqmin] break-words text-[clamp(0.42rem,2.2cqmin,0.72rem)] leading-[1.6]">{a}</div>
                    </div>
                  </div>
                ) : null,
              )}
            </div>

            {/* coin field */}
            <div className="pointer-events-none absolute inset-x-0 top-[12%] bottom-[4%]">
              {coins.map((c) => (
                <button key={c.id} type="button" onPointerDown={(e) => grab(c, e)} aria-label="Collect coin" className="pointer-events-auto absolute h-[8cqmin] w-[8cqmin] animate-[bobStep_0.8s_steps(2)_infinite]" style={{ left: `${c.x}%`, top: `${c.y}%`, animationDelay: `${(c.id % 4) * 0.2}s` }}>
                  <Sprite rows={COIN} palette={COIN_PAL} className="h-full w-full" />
                </button>
              ))}
              {pops.map((p) => (
                <div key={p.id} className="absolute animate-fade-up text-[2.6cqmin]" style={{ left: `${p.x}%`, top: `${p.y - 6}%`, color: YELLOW, textShadow: '0.4cqmin 0.4cqmin 0 #000' }}>
                  +100
                </div>
              ))}
            </div>

            <div className="flex-1" />
          </div>
        )}

        {/* dialogue box */}
        {step >= 4 ? (
          <div className="relative mx-[3cqmin] mb-[14cqmin] animate-fade-up border-[1.2cqmin] border-white bg-[#0d0c2e] px-[3.4cqmin] pb-[3.4cqmin] pt-[4.4cqmin]" style={{ boxShadow: `0 0 0 1cqmin #000, 1.4cqmin 1.4cqmin 0 1cqmin #000` }}>
            <div className="absolute -top-[3cqmin] left-[3cqmin] border-[0.8cqmin] border-white px-[2cqmin] py-[0.8cqmin] text-[clamp(0.4rem,2cqmin,0.65rem)]" style={{ background: PINK }}>
              {w.hasFrom ? w.from.slice(0, 14).toUpperCase() : 'FRIEND'}
            </div>
            <p className="text-[clamp(0.45rem,2.2cqmin,0.75rem)] leading-[1.9]">
              <Typewriter text={w.message} speed={30} delay={300} cursor={false} />
            </p>
            <span className="absolute bottom-[1.4cqmin] right-[2.4cqmin] animate-[blink_0.8s_steps(1)_infinite] text-[2.6cqmin]" style={{ color: YELLOW }}>▼</span>
          </div>
        ) : null}
      </div>

      {/* ground */}
      <div className="pointer-events-none absolute bottom-0 left-0 z-[5] h-[9cqmin] w-[calc(100%+12cqmin)] animate-[tileX_1.2s_linear_infinite]" style={{ '--tile': '12cqmin', background: `linear-gradient(to bottom, ${MINT} 0 1.6cqmin, #00b383 1.6cqmin 3cqmin, #5b3a22 3cqmin)`, backgroundSize: '12cqmin 100%' }} />
    </Stage>
  );
}
