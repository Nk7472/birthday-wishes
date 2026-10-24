import { useEffect, useState } from 'react';
import Avatar from '../components/shared/Avatar';
import Board from '../components/shared/Board';
import { useTimeline } from '../components/shared/hooks';
import Stage from '../components/shared/Stage';
import { useWish } from '../components/shared/WishContext';
import { sfx } from '../lib/audio';
import { confetti } from '../lib/confetti';

const Y = '#ffe600';
const R = '#e8202a';
const C = '#00b7ff';
const M = '#ff3fa5';
const WORDS = ['POW!', 'ZAP!', 'BAM!', 'WHAM!', 'YAY!', 'BOOM!'];
const outline = (c = '#000', t = 0.5) => `${-t}cqw ${-t}cqw 0 ${c}, ${t}cqw ${-t}cqw 0 ${c}, ${-t}cqw ${t}cqw 0 ${c}, ${t}cqw ${t}cqw 0 ${c}, 0 ${t * 2.2}cqw 0 ${c}`;
const comic = { fontFamily: "'Bangers', 'Impact', cursive" };

const BURST = 'polygon(50% 0%, 61% 20%, 80% 5%, 79% 29%, 100% 28%, 87% 46%, 100% 62%, 79% 66%, 85% 88%, 63% 80%, 52% 100%, 42% 82%, 22% 95%, 22% 72%, 0% 68%, 14% 50%, 0% 32%, 21% 29%, 18% 6%, 40% 20%)';

/** A comic panel that slams in at `at` (a timeline step). */
function Panel({ at, step, rot = 0, className = '', style, children, onHit, bg = '#fff' }) {
  const [jolt, setJolt] = useState(0);
  return (
    <div
      className={`absolute ${className}`}
      style={{ ...style, opacity: step >= at ? 1 : 0, '--r': `${rot}deg`, animation: step >= at ? 'slam 0.55s cubic-bezier(0.2,0.9,0.3,1) both' : undefined }}
    >
      <div
        key={jolt}
        role="button"
        tabIndex={0}
        onPointerDown={(e) => {
          setJolt((j) => j + 1);
          onHit?.(e);
        }}
        className="relative h-full w-full cursor-pointer overflow-hidden border-[1.1cqw] border-black shadow-[1.8cqw_1.8cqw_0_#000]"
        style={{ background: bg, animation: jolt ? 'shake 0.35s linear' : undefined }}
      >
        {children}
      </div>
    </div>
  );
}

function Halftone({ color = 'rgba(0,0,0,0.18)', size = 2.2, className = '' }) {
  return <div className={`pointer-events-none absolute inset-0 ${className}`} style={{ backgroundImage: `radial-gradient(${color} 22%, transparent 24%)`, backgroundSize: `${size}cqw ${size}cqw` }} />;
}

function Speed({ colorA = '#fff', colorB = 'transparent' }) {
  return <div className="absolute inset-0 animate-spin-slow [animation-duration:40s]" style={{ background: `repeating-conic-gradient(from 0deg at 50% 50%, ${colorA} 0 4deg, ${colorB} 4deg 11deg)`, transform: 'scale(2.2)' }} />;
}

export default function ComicPop() {
  const w = useWish();
  const step = useTimeline([300, 1500, 2700, 4200, 6200, 8200]);
  const [hits, setHits] = useState([]);
  const [shake, setShake] = useState(0);

  useEffect(() => {
    if (step >= 1 && step <= 5) {
      sfx.boom();
      setShake((s) => s + 1);
    }
    if (step === 3) sfx.pop();
  }, [step]);

  const hit = (e) => {
    const board = e.currentTarget.closest('[data-board]');
    const r = board.getBoundingClientRect();
    const id = Date.now() + Math.random();
    setHits((h) => [...h.slice(-5), { id, x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100, word: WORDS[Math.floor(Math.random() * WORDS.length)], rot: Math.random() * 24 - 12 }]);
    setTimeout(() => setHits((h) => h.filter((q) => q.id !== id)), 900);
    Math.random() > 0.5 ? sfx.pop() : sfx.boom();
    const st = e.currentTarget.closest('[data-stage]').getBoundingClientRect();
    confetti.burst({ x: (e.clientX - st.left) / st.width, y: (e.clientY - st.top) / st.height, count: 26, spread: 360, power: 0.7, colors: [Y, R, C, M, '#fff'], shapes: ['rect', 'star'] });
  };

  const nameUp = w.name.toUpperCase();
  const nameSize = Math.max(7, Math.min(15, 76 / (nameUp.length * 0.55)));
  const next = w.age ? w.age + 1 : null;

  return (
    <Stage className="bg-[#ffe600]">
      <div key={shake} className="absolute inset-0" style={{ animation: 'shake 0.3s linear' }}>
        {/* halftone backdrop */}
        <div className="absolute inset-0 bg-[#00b7ff]" />
        <div className="absolute inset-x-0 bottom-0 -top-[3.4cqmin] animate-[tileY_1.2s_linear_infinite]" style={{ '--tile': '3.4cqmin', backgroundImage: 'radial-gradient(#fff 24%, transparent 26%)', backgroundSize: '3.4cqmin 3.4cqmin', opacity: 0.35 }} />
        <div className="absolute inset-0 rotate-[18deg] scale-150 opacity-60" style={{ backgroundImage: `radial-gradient(${M} 28%, transparent 30%)`, backgroundSize: '5cqmin 5cqmin', maskImage: 'linear-gradient(to bottom, transparent, #000 60%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent, #000 60%)' }} />

        <Board ratio={9 / 18}>
          <div data-board className="absolute inset-0">
            {/* 1: caption */}
            <Panel at={1} step={step} rot={-1.2} className="left-[4%] top-[4%] h-[10.5%] w-[92%]" bg={Y} onHit={hit}>
              <div className="flex h-full items-center px-[4cqw] font-ui text-[3.7cqw] font-extrabold uppercase leading-tight text-black">Meanwhile… in a world that badly needed cake…</div>
            </Panel>

            {/* 2: the big announcement */}
            <Panel at={2} step={step} rot={1} className="left-[4%] top-[17.5%] h-[24%] w-[92%]" bg={R} onHit={hit}>
              <Speed colorA="rgba(255,255,255,0.22)" />
              <Halftone color="rgba(0,0,0,0.25)" />
              <div className="absolute inset-0 grid place-items-center text-center" style={comic}>
                <div>
                  <div className="text-[9cqw] leading-none text-[#ffe600]" style={{ textShadow: outline('#000', 0.5), transform: 'rotate(-3deg)' }}>KA-POW!</div>
                  <div className="mt-[1cqw] leading-none text-white" style={{ fontSize: `${Math.min(8, nameSize * 0.62)}cqw`, textShadow: outline('#000', 0.45) }}>
                    IT'S {nameUp}'S BIRTHDAY!
                  </div>
                </div>
              </div>
            </Panel>

            {/* 3: the hero */}
            <Panel at={3} step={step} rot={-1.4} className="left-[4%] top-[44.5%] h-[24%] w-[44%]" bg={C} onHit={hit}>
              <Speed colorA="rgba(255,255,255,0.45)" />
              <div className="absolute inset-0 grid place-items-center">
                <div className="relative">
                  <Avatar rounded="rounded-none" className="h-[26cqw] w-[26cqw] border-[1cqw] border-black" fallbackClassName="bg-[#ffe600]" textClassName="text-black" style={{ transform: 'rotate(2deg)' }} />
                  {w.ageText ? (
                    <div className="absolute -bottom-[3cqw] -right-[4cqw] grid h-[11cqw] w-[11cqw] place-items-center border-[0.9cqw] border-black bg-[#ff3fa5] text-white" style={{ ...comic, fontSize: '6cqw', clipPath: BURST, transform: 'rotate(8deg)' }}>
                      {w.ageText}
                    </div>
                  ) : null}
                </div>
              </div>
            </Panel>

            {/* speech bubble */}
            <Panel at={3} step={step} rot={1.2} className="left-[52%] top-[43.5%] h-[9.5%] w-[44%]" bg="#fff" onHit={hit}>
              <div className="grid h-full place-items-center px-[2cqw] text-center font-ui text-[3.5cqw] font-extrabold leading-tight text-black">Is it that time already?!</div>
              <div className="absolute -bottom-[0.5cqw] left-[10%] h-[5cqw] w-[5cqw] rotate-45 border-b-[1cqw] border-r-[1cqw] border-black bg-white" />
            </Panel>

            {/* 4: message bubble */}
            <Panel at={4} step={step} rot={-0.8} className="left-[52%] top-[55%] h-[14.5%] w-[44%]" bg="#fff" onHit={hit}>
              <Halftone color="rgba(0,183,255,0.18)" />
              <div className="relative flex h-full flex-col justify-center overflow-hidden px-[2.4cqw] py-[0.6cqw] font-ui text-black">
                <p className="font-bold leading-[1.2]" style={{ fontSize: `${w.message.length > 140 ? 2.15 : w.message.length > 90 ? 2.5 : 2.8}cqw` }}>{w.message}</p>
                {w.hasFrom ? <p className="mt-[1cqw] text-right text-[3cqw] font-extrabold" style={{ color: R }}>— {w.from}</p> : null}
              </div>
            </Panel>

            {/* wish stickers */}
            {w.wishes.map((x, i) => (
              <Panel key={i} at={5} step={step} rot={[-2, 1.5, -1][i]} className="h-[7.4%]" style={{ left: `${4 + i * 31.4}%`, top: '70.4%', width: '29.4%' }} bg={[Y, M, '#8bff6b'][i]} onHit={hit}>
                <div className="flex h-full flex-col justify-center px-[1.4cqw] text-center leading-[1.05] text-black">
                  <span className="text-[4cqw]" style={comic}>{['WOW!', 'AWW!', 'YAY!'][i]}</span>
                  <span className="font-ui text-[2.15cqw] font-bold">{x}</span>
                </div>
              </Panel>
            ))}

            {/* 5: to be continued */}
            <Panel at={6} step={step} rot={0.8} className="left-[4%] top-[82.5%] h-[12.5%] w-[92%]" bg="#111" onHit={hit}>
              <Halftone color="rgba(255,230,0,0.22)" />
              <div className="relative flex h-full items-center justify-between px-[4cqw]">
                <div style={comic} className="text-[7cqw] leading-none text-[#ffe600]">
                  TO BE CONTINUED…
                  {next ? <span className="block text-[4.4cqw] text-white">…in age {next}!</span> : null}
                </div>
                <span className="animate-bounce-soft text-[11cqw]" aria-hidden="true">🎂</span>
              </div>
            </Panel>

            {/* tap bursts */}
            {hits.map((h) => (
              <div key={h.id} className="pointer-events-none absolute z-50 grid -translate-x-1/2 -translate-y-1/2 place-items-center" style={{ left: `${h.x}%`, top: `${h.y}%`, width: '34cqw', height: '30cqw', '--r': `${h.rot}deg`, animation: 'slam 0.5s ease-out both' }}>
                <div className="absolute inset-0 border-black bg-[#ffe600]" style={{ clipPath: BURST }} />
                <div className="absolute inset-[7%] bg-[#e8202a]" style={{ clipPath: BURST }} />
                <span className="relative text-[8cqw] leading-none text-white" style={{ ...comic, textShadow: outline('#000', 0.4) }}>{h.word}</span>
              </div>
            ))}
          </div>
        </Board>
      </div>
    </Stage>
  );
}
