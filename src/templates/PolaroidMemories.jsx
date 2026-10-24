import { useEffect, useState } from 'react';
import Avatar from '../components/shared/Avatar';
import Board from '../components/shared/Board';
import { useTimeline } from '../components/shared/hooks';
import Stage from '../components/shared/Stage';
import Typewriter from '../components/shared/Typewriter';
import { useWish } from '../components/shared/WishContext';
import { sfx } from '../lib/audio';
import { confetti } from '../lib/confetti';

const INK = '#2a3f7a';
const hand = 'font-hand';

function Doodle({ d, color = '#e0476f', delay = 0, className = '', style, width = 2.6 }) {
  return (
    <svg viewBox="0 0 40 40" className={`pointer-events-none absolute ${className}`} style={style} aria-hidden="true">
      <path d={d} pathLength="1" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: 'draw 1.4s ease-out forwards', animationDelay: `${delay}ms` }} />
    </svg>
  );
}

const TAPES = ['bg-pink-300/70', 'bg-sky-300/70', 'bg-yellow-200/80'];

/** One polaroid. pos is the CENTRE in board %, w is width in cqw. */
function Polaroid({ x, y, w, rot, fly, delay, tape, z, caption, zoom, filter, front, onPick, develop, children, clip }) {
  const photoSize = w - 6;
  return (
    <div className="absolute" style={{ left: `${x}%`, top: `${y}%`, width: `${w}cqw`, transform: 'translate(-50%,-50%)', zIndex: front ? 50 : z }}>
      <div style={{ '--fx': fly[0], '--fy': fly[1], '--r': `${rot}deg`, animation: 'flyIn 1.05s cubic-bezier(0.22,1.25,0.45,1) both', animationDelay: `${delay}ms` }}>
        <button
          type="button"
          onPointerDown={(e) => {
            e.stopPropagation();
            onPick();
          }}
          className="relative block w-full cursor-pointer bg-[#fffdf6] text-left shadow-[0_1.4cqw_3cqw_rgba(40,20,0,0.45)] transition-transform duration-500 ease-[cubic-bezier(0.3,1.5,0.5,1)]"
          style={{ padding: '3cqw 3cqw 0', transform: front ? 'rotate(0deg) scale(1.1)' : 'none' }}
          aria-label="Bring photo to front"
        >
          {clip ? (
            <span className="absolute -top-[4.4cqw] left-1/2 h-[7cqw] w-[2.6cqw] -translate-x-1/2 rounded-sm bg-gradient-to-b from-[#e8c58e] to-[#b98b5b] shadow-md" />
          ) : (
            <span className={`absolute -top-[2cqw] left-1/2 h-[5cqw] w-[14cqw] -translate-x-1/2 -rotate-2 ${tape} shadow-sm`} />
          )}
          <div className="relative overflow-hidden bg-[#222]" style={{ width: `${photoSize}cqw`, height: `${photoSize}cqw`, filter, transition: develop ? 'filter 3.2s ease-out' : undefined }}>
            <div className="h-full w-full" style={{ transform: `scale(${zoom})` }}>
              <Avatar rounded="rounded-none" className="h-full w-full" fallbackClassName="bg-gradient-to-br from-[#ffb3a7] via-[#ffd6a5] to-[#a0c4ff]" textClassName="font-hand font-bold text-white" />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.22),transparent_45%)]" />
          </div>
          <div className={`${hand} flex items-center justify-center px-[1cqw] text-center leading-[1.05]`} style={{ height: `${w * 0.3}cqw`, fontSize: `${Math.max(4, w * 0.082)}cqw`, color: INK }}>
            {caption}
          </div>
        </button>
      </div>
    </div>
  );
}

function FairyLights() {
  const bulbs = Array.from({ length: 9 });
  const colors = ['#ffe9a8', '#ffc4d6', '#c9e8ff', '#ffe9a8'];
  return (
    <svg viewBox="0 0 100 14" className="pointer-events-none absolute inset-x-0 top-0 z-[60] w-full" aria-hidden="true">
      <path d="M-2 2 Q25 11 50 6 T102 3" fill="none" stroke="#3a2a1a" strokeWidth="0.35" />
      {bulbs.map((_, i) => {
        const x = 4 + i * 11.6;
        const y = 3.6 + Math.sin(i * 0.9) * 2.4 + (i % 2) * 1.5;
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="1.5" fill={colors[i % 4]} className="animate-twinkle" style={{ animationDelay: `${i * 0.35}s` }} />
            <circle cx={x} cy={y} r="3.4" fill={colors[i % 4]} opacity="0.2" className="animate-twinkle" style={{ animationDelay: `${i * 0.35}s` }} />
          </g>
        );
      })}
    </svg>
  );
}

export default function PolaroidMemories() {
  const w = useWish();
  const step = useTimeline([200, 700, 1200, 1900, 5200, 6200]);
  const [front, setFront] = useState(-1);
  const caption = w.ordinal ? `Happy ${w.ordinal} Birthday, ${w.name}!` : `Happy Birthday, ${w.name}!`;

  useEffect(() => {
    if (step >= 1 && step <= 4) sfx.whoosh();
    if (step === 5) sfx.chime(880);
  }, [step]);

  const pick = (i) => {
    setFront((f) => (f === i ? -1 : i));
    sfx.pop();
  };

  const board = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    confetti.burst({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height, count: 14, spread: 140, power: 0.7, gravity: 0.7, emojis: ['❤️', '⭐', '🎈'], ttl: 3 });
    sfx.sparkle();
  };

  const smalls = [
    { x: 27, y: 21, w: 40, rot: -5, fly: ['-110cqw', '-20cqh'], zoom: 1.5, filter: 'sepia(0.45) saturate(1.2)', tape: TAPES[0], text: w.wishes[0], delay: 700 },
    { x: 73, y: 20, w: 40, rot: 4, fly: ['110cqw', '-30cqh'], zoom: 1.25, filter: 'grayscale(1) contrast(1.1)', tape: TAPES[1], text: w.wishes[1], delay: 1200 },
    { x: 21, y: 67, w: 36, rot: -6, fly: ['-110cqw', '30cqh'], zoom: 1.7, filter: 'saturate(0.7) brightness(1.1)', tape: TAPES[2], text: w.wishes[2], delay: 1900 },
  ];

  return (
    <Stage className="bg-[#b98b5b]">
      {/* cork */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#c99b68_0,transparent_45%),radial-gradient(circle_at_80%_70%,#a8794b_0,transparent_50%)]" />
      <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(#7a5230_0.35cqmin,transparent_0.5cqmin),radial-gradient(#e0b98a_0.3cqmin,transparent_0.45cqmin)] [background-position:0_0,2.4cqmin_1.6cqmin] [background-size:4.6cqmin_4.6cqmin]" />
      <div className="absolute inset-0 shadow-[inset_0_0_9cqmin_rgba(60,30,5,0.65)]" />
      <div className="absolute inset-[1.6cqmin] rounded-[1cqmin] border-[1.4cqmin] border-[#7a5230]/80 shadow-[inset_0_0_2cqmin_rgba(0,0,0,0.35)]" />

      <Board ratio={9 / 18.5}>
        <div className="absolute inset-0" onPointerDown={board}>
          <FairyLights />
          {/* twine */}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute left-0 top-[8%] z-[5] h-[10%] w-full" aria-hidden="true">
            <path d="M-2 30 Q50 78 102 30" fill="none" stroke="#e8d9b5" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
          </svg>

          {/* doodles */}
          <Doodle d="M20 33 C 6 22, 8 8, 20 14 C 32 8, 34 22, 20 33 Z" className="right-[4%] top-[70%] w-[13cqw]" delay={2500} />
          <Doodle d="M4 20 C 12 8, 20 32, 28 18 S 36 12, 38 22" color="#2a8f6a" className="right-[5%] top-[40%] w-[15cqw]" delay={3000} />
          <Doodle d="M20 4 L24 16 L37 16 L27 24 L31 36 L20 29 L9 36 L13 24 L3 16 L16 16 Z" color="#e0a41f" className="left-[5%] top-[40%] w-[11cqw]" delay={3400} />
          <Doodle d="M6 34 C 14 22, 22 18, 34 8 M34 8 L24 9 M34 8 L33 18" color="#7b4fd1" className="left-[44%] top-[70%] w-[11cqw]" delay={3800} width={2.2} />

          {smalls.map((s, i) => (
            <Polaroid key={i} {...s} z={10 + i} caption={s.text} front={front === i} onPick={() => pick(i)} clip={i < 2} />
          ))}

          {/* main polaroid, develops over ~3s */}
          <Polaroid x={52} y={50} w={56} rot={2} fly={['0cqw', '-120cqh']} delay={200} tape={TAPES[0]} z={20} zoom={1} front={front === 3} onPick={() => pick(3)} develop filter={step >= 3 ? 'none' : 'brightness(2) grayscale(1) sepia(0.7) blur(0.8cqw)'} caption={<Typewriter text={caption} speed={55} delay={300} active={step >= 4} cursor={false} />} />

          {/* notebook note */}
          {step >= 5 ? (
            <div className="absolute z-30" style={{ left: '50%', top: '85%', width: '92cqw', transform: 'translate(-50%,-50%) rotate(-1.2deg)' }}>
              <div className="relative animate-pop-in bg-white px-[4cqw] pb-[3cqw] pt-[4cqw] shadow-[0_1.4cqw_3cqw_rgba(40,20,0,0.45)]" style={{ backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0, transparent 5.4cqw, #a9cdea 5.4cqw, #a9cdea 5.6cqw)', backgroundPosition: '0 2cqw' }}>
                <span className="absolute left-[9cqw] top-0 h-full w-[0.35cqw] bg-[#ef8a8a]" />
                <span className="absolute -top-[1.6cqw] left-1/2 h-[4.6cqw] w-[4.6cqw] -translate-x-1/2 rounded-full bg-[#e0476f] shadow-md" />
                <p className={`${hand} pl-[8cqw] text-[4.6cqw] font-bold leading-[5.6cqw]`} style={{ color: INK }}>
                  <Typewriter text={w.message} speed={30} cursor={false} />
                </p>
                {w.hasFrom ? <p className={`${hand} mt-[1cqw] pl-[8cqw] text-right text-[5.4cqw] font-bold`} style={{ color: '#e0476f' }}>— {w.from} ♥</p> : null}
              </div>
            </div>
          ) : null}
        </div>
      </Board>
    </Stage>
  );
}
