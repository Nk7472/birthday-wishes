import { useEffect, useRef, useState } from 'react';
import Avatar from '../components/shared/Avatar';
import Balloon from '../components/shared/Balloon';
import Board from '../components/shared/Board';
import Cake from '../components/shared/Cake';
import Drift from '../components/shared/Drift';
import SplitText from '../components/shared/SplitText';
import Stage from '../components/shared/Stage';
import Teddy from '../components/shared/Teddy';
import Typewriter from '../components/shared/Typewriter';
import { useWish } from '../components/shared/WishContext';
import { sfx } from '../lib/audio';
import { confetti } from '../lib/confetti';
import { fitName } from '../lib/fit';

/* ------------------------------------------------------------------ */
/* The script: [scene, duration in ms]                                 */
/* ------------------------------------------------------------------ */
const SCENES = [
  ['peek', 3200],
  ['wave', 3000],
  ['hat', 2700],
  ['bananaIn', 1400],
  ['walk', 1500],
  ['slip', 1700],
  ['dizzy', 2000],
  ['photo', 4700],
  ['dance', 5000],
  ['cakeIn', 2000],
  ['sneeze', 3300],
  ['icing', 2900],
  ['card', Infinity],
];
const IDX = Object.fromEntries(SCENES.map(([n], i) => [n, i]));
const PALETTE = ['#ff5d8f', '#ffb300', '#26c6a6', '#5c7cfa', '#ff7a45', '#b259e6'];
const comic = { fontFamily: "'Fredoka', 'Baloo 2', system-ui, sans-serif" };
const sw = (vars, dur = 0.6, delay = 0, ease = 'ease-in-out') => ({ ...vars, animation: `tedSwing ${dur}s ${ease} ${delay}s infinite` });

/* ------------------------------------------------------------------ */
/* Motion table: which part does what in which scene                   */
/* ------------------------------------------------------------------ */
function motionFor(id, sub) {
  const idle = {
    head: sw({ '--a0': '-3deg', '--a1': '3deg' }, 2.8),
    armL: sw({ '--a0': '3deg', '--a1': '-2deg' }, 3.1),
    armR: sw({ '--a0': '-3deg', '--a1': '2deg' }, 3.3),
    legL: {},
    legR: {},
    headFx: {},
  };
  switch (id) {
    case 'peek':
      return { ...idle, head: sw({ '--a0': '-7deg', '--a1': '7deg' }, 0.9) };
    case 'wave':
      return { ...idle, armR: sw({ '--a0': '-138deg', '--a1': '-172deg' }, 0.42), head: sw({ '--a0': '3deg', '--a1': '9deg' }, 0.8) };
    case 'hat':
      return { ...idle, headFx: sub >= 1 ? { animation: 'squish 0.55s ease-out both', transformOrigin: '100px 100px' } : {}, armL: sw({ '--a0': '20deg', '--a1': '60deg' }, 0.3), armR: sw({ '--a0': '-20deg', '--a1': '-60deg' }, 0.3) };
    case 'bananaIn':
      return { ...idle, armR: sw({ '--a0': '-62deg', '--a1': '-48deg' }, 0.5) };
    case 'walk':
      return {
        ...idle,
        legL: sw({ '--y0': '0px', '--y1': '-9px' }, 0.5),
        legR: sw({ '--y0': '0px', '--y1': '-9px' }, 0.5, -0.25),
        armL: sw({ '--a0': '-20deg', '--a1': '28deg' }, 0.5),
        armR: sw({ '--a0': '20deg', '--a1': '-28deg' }, 0.5),
      };
    case 'slip':
      return {
        ...idle,
        armL: sw({ '--a0': '40deg', '--a1': '165deg' }, 0.22),
        armR: sw({ '--a0': '-40deg', '--a1': '-165deg' }, 0.22),
        legL: sw({ '--a0': '-26deg', '--a1': '26deg' }, 0.26),
        legR: sw({ '--a0': '26deg', '--a1': '-26deg' }, 0.26),
      };
    case 'dizzy':
      return { ...idle, head: sw({ '--a0': '-11deg', '--a1': '11deg', '--y0': '2px', '--y1': '2px' }, 0.55), armL: { transform: 'rotate(8deg)' }, armR: { transform: 'rotate(-8deg)' } };
    case 'photo':
      return { ...idle, armL: { transform: 'rotate(62deg)' }, armR: { transform: 'rotate(-62deg)' }, head: sub >= 1 ? sw({ '--a0': '4deg', '--a1': '9deg', '--y0': '2px', '--y1': '7px' }, 0.5) : idle.head };
    case 'dance':
      return {
        head: sw({ '--a0': '-9deg', '--a1': '9deg' }, 0.6),
        armL: sw({ '--a0': '30deg', '--a1': '150deg' }, 0.6),
        armR: sw({ '--a0': '-150deg', '--a1': '-30deg' }, 0.6),
        legL: sw({ '--y0': '0px', '--y1': '-11px' }, 0.3),
        legR: sw({ '--y0': '-11px', '--y1': '0px' }, 0.3),
        headFx: {},
      };
    case 'sneeze': {
      const poses = ['rotate(4deg) translateY(2px)', 'rotate(-16deg) translateY(-4px)', 'rotate(-25deg) translateY(-7px)', 'rotate(30deg) translateY(12px)'];
      return { ...idle, head: { transform: poses[sub], transformOrigin: '100px 100px', transition: sub === 3 ? 'transform 0.12s ease-in' : 'transform 0.5s ease-out' }, headFx: sub === 2 ? { animation: 'tedSwing 0.09s linear infinite', '--x0': '-1.2px', '--x1': '1.2px' } : {} };
    }
    case 'icing':
      return sub === 0
        ? { ...idle, head: { transform: 'rotate(8deg) translateY(6px)', transformOrigin: '100px 100px' }, armL: { transform: 'rotate(10deg)' }, armR: { transform: 'rotate(-10deg)' } }
        : { ...idle, head: sw({ '--a0': '-4deg', '--a1': '8deg' }, 0.45), armR: sw({ '--a0': '-30deg', '--a1': '-42deg' }, 0.45) };
    case 'card':
      return {
        head: sw({ '--a0': '-6deg', '--a1': '6deg' }, 0.7),
        armL: sw({ '--a0': '158deg', '--a1': '174deg' }, 0.5),
        armR: sw({ '--a0': '-158deg', '--a1': '-174deg' }, 0.5),
        legL: sw({ '--y0': '0px', '--y1': '-7px' }, 0.5),
        legR: sw({ '--y0': '-7px', '--y1': '0px' }, 0.5),
        headFx: {},
      };
    default:
      return idle;
  }
}

function faceFor(id, sub) {
  switch (id) {
    case 'peek':
      return 'happy';
    case 'hat':
      return sub >= 1 ? 'cross' : 'surprised';
    case 'wave':
    case 'walk':
    case 'dance':
    case 'card':
      return 'open';
    case 'slip':
      return 'surprised';
    case 'dizzy':
      return 'dizzy';
    case 'photo':
      return sub >= 1 ? 'kiss' : 'happy';
    case 'sneeze':
      return sub === 0 ? 'happy' : sub < 3 ? 'scrunch' : 'surprised';
    case 'icing':
      return sub === 0 ? 'sad' : 'yum';
    default:
      return 'happy';
  }
}

/* ------------------------------------------------------------------ */
/* Little props                                                        */
/* ------------------------------------------------------------------ */
function Bubble({ text, left = '50%' }) {
  if (!text) return null;
  return (
    <div className="pointer-events-none absolute z-40 -translate-x-1/2" style={{ left, bottom: '60.2%', width: 'max-content', maxWidth: '82cqw' }}>
      <div key={text} className="relative rounded-[5cqw] border-[0.8cqw] border-[#3a1d0f] bg-white px-[5cqw] py-[2.6cqw] text-center font-bold leading-[1.15] text-[#3a1d0f] shadow-[0_1.4cqw_0_rgba(58,29,15,0.25)]" style={{ ...comic, fontSize: '6.4cqw', animation: 'tedBubble 0.45s cubic-bezier(0.3,1.5,0.5,1) both' }}>
        {text}
        <span className="absolute -bottom-[2.6cqw] left-1/2 h-[4.4cqw] w-[4.4cqw] -translate-x-1/2 rotate-45 border-b-[0.8cqw] border-r-[0.8cqw] border-[#3a1d0f] bg-white" />
      </div>
    </div>
  );
}

function Peel() {
  return (
    <svg viewBox="0 0 120 60" className="w-full" aria-hidden="true">
      <ellipse cx="60" cy="52" rx="48" ry="6" fill="rgba(60,20,10,0.25)" />
      <path d="M12 44 C 8 20, 34 12, 60 30 C 86 12, 112 20, 108 44 C 100 36, 84 34, 70 44 C 62 38, 58 38, 50 44 C 36 34, 20 36, 12 44 Z" fill="#ffd23f" stroke="#c99a12" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M60 30 C 56 20, 62 12, 70 10" stroke="#8a6a1a" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M24 36 Q34 26 48 34" stroke="#fff3a8" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}

function Pennants({ name }) {
  const full = [...name.toUpperCase()].filter((c) => c.trim());
  const first = name.split(/[\s-]+/)[0] || name;
  const letters = full.length > 12 && [...first].length >= 3 ? [...first.toUpperCase()] : full;
  const n = Math.max(1, letters.length);
  const w = Math.min(12, 80 / n);
  return (
    <div className="pointer-events-none absolute inset-x-[6cqw] top-[6.6%] z-[6]">
      <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="absolute inset-x-0 top-0 h-[5cqw] w-full" aria-hidden="true">
        <path d="M0 1 Q50 7 100 1" fill="none" stroke="#7a4a2a" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="relative flex h-[18cqw] items-start justify-center" style={{ gap: `${Math.min(1.2, w * 0.1)}cqw` }}>
        {letters.map((ch, i) => {
          const t = n === 1 ? 0.5 : i / (n - 1);
          const sag = Math.sin(Math.PI * t) * 3.6;
          return (
            <div key={i} style={{ width: `${w}cqw`, marginTop: `${sag + 0.4}cqw`, animation: `jelly 0.9s both`, animationDelay: `${300 + i * 110}ms` }}>
              <div style={{ transformOrigin: '50% 0%', animation: `tedSwing ${2.4 + (i % 3) * 0.4}s ease-in-out ${-i * 0.3}s infinite`, '--a0': '-4deg', '--a1': '4deg' }}>
                <div className="grid place-items-start justify-items-center pt-[0.8cqw] font-bold text-white" style={{ ...comic, height: `${w * 1.22}cqw`, background: PALETTE[i % PALETTE.length], clipPath: 'polygon(0 0, 100% 0, 50% 100%)', fontSize: `${w * 0.62}cqw`, lineHeight: 1 }}>
                  {ch}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Polaroid({ name, hold }) {
  return (
    <div className="relative w-full" style={{ aspectRatio: '1 / 1.2', containerType: 'size' }}>
      <div className="absolute inset-0 rounded-[3cqmin] bg-[#fffdf6] shadow-[0_2cqmin_5cqmin_rgba(60,25,5,0.4)]" />
      <div className="absolute left-[6%] top-[6%]">
        <Avatar rounded="rounded-[1.5cqmin]" className="h-[88cqmin] w-[88cqmin]" fallbackClassName="bg-gradient-to-br from-[#ffb3a7] via-[#ffd6a5] to-[#a0c4ff]" textClassName="font-hand font-bold text-white" />
      </div>
      <p className="absolute inset-x-[4%] bottom-[3.4%] truncate text-center font-hand font-bold text-[#3a1d0f]" style={{ fontSize: `${Math.min(12, 70 / Math.max(5, [...name].length * 0.62))}cqmin`, lineHeight: 1.1 }}>{name}</p>
      <span className="absolute -top-[4%] left-1/2 h-[9%] w-[34%] -translate-x-1/2 -rotate-2 bg-pink-300/70 shadow-sm" style={{ opacity: hold ? 0 : 1, transition: 'opacity 0.5s' }} />
    </div>
  );
}

function Paw({ className }) {
  return (
    <span className={`absolute grid h-[10cqw] w-[10cqw] place-items-center rounded-full ${className}`} style={{ background: '#dd9f5f', boxShadow: 'inset 0 0 0 0.5cqw #7d4d24' }}>
      <span className="h-[4.4cqw] w-[4.4cqw] rounded-full bg-[#f4d9ac]" />
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* The scene                                                           */
/* ------------------------------------------------------------------ */
export default function FunnyTeddy() {
  const w = useWish();
  const [i, setI] = useState(0);
  const [sub, setSub] = useState(0);
  const [bubble, setBubble] = useState('');
  const [poke, setPoke] = useState({ n: 0, text: '' });
  const [lit, setLit] = useState(true);
  const [hat, setHat] = useState('none');
  const [sawCake, setSawCake] = useState(false);
  const alive = useRef(true);
  const id = SCENES[i][0];
  const past = (n) => i >= IDX[n];
  const NAME = w.name;

  useEffect(() => () => { alive.current = false; }, []);

  // advance through the script
  useEffect(() => {
    const d = SCENES[i][1];
    if (!Number.isFinite(d)) return;
    const t = setTimeout(() => setI((x) => Math.min(x + 1, SCENES.length - 1)), d);
    return () => clearTimeout(t);
  }, [i]);

  // what happens (sound, captions, gags) in each scene
  useEffect(() => {
    const T = [];
    const at = (ms, fn) => T.push(setTimeout(() => alive.current && fn(), ms));
    setSub(0);
    setBubble('');
    switch (id) {
      case 'peek':
        at(700, () => sfx.squeak(1300));
        at(1700, () => sfx.squeak(1800));
        at(2350, () => sfx.boing());
        break;
      case 'wave':
        at(100, () => { setBubble(`Psst… ${NAME}!`); sfx.squeak(1700); });
        at(1500, () => { setBubble('Guess what day it is?'); sfx.chime(784); });
        break;
      case 'hat':
        setHat('on');
        at(0, () => sfx.whoosh());
        at(650, () => { setSub(1); setBubble('BONK!'); sfx.thud(); sfx.squeak(900); });
        at(1500, () => { setBubble('TOOT TOOT!'); sfx.partyHorn(); confetti.burst({ x: 0.5, y: 0.56, count: 70, angle: -90, spread: 90, power: 1.1 }); });
        break;
      case 'bananaIn':
        at(0, () => { sfx.whoosh(); setBubble('Is that… a banana?'); });
        break;
      case 'walk':
        at(0, () => setBubble('Nothing can go wr—'));
        [250, 750, 1250].forEach((ms) => at(ms, () => { sfx.thud(); sfx.squeak(1200 + ms); }));
        break;
      case 'slip':
        at(0, () => { setBubble(''); sfx.slide('down'); });
        at(1450, () => { sfx.thud(); confetti.burst({ x: 0.72, y: 0.84, count: 22, angle: -90, spread: 120, power: 0.5, shapes: ['star'], colors: ['#ffd54a', '#fff'] }); });
        break;
      case 'dizzy':
        at(100, () => sfx.womp());
        at(1100, () => setBubble("I'm okay!"));
        break;
      case 'photo':
        at(0, () => { sfx.pop(); setBubble('Wait… who is this cutie?'); });
        at(900, () => sfx.sparkle());
        at(1900, () => { setSub(1); setBubble(`${NAME}!!`); sfx.pop(); sfx.chime(1046); confetti.burst({ x: 0.5, y: 0.6, count: 26, spread: 140, power: 0.9, gravity: 0.5, emojis: ['💖', '😘', '✨'], ttl: 3 }); });
        at(3500, () => { setBubble('Mwah! 😘'); sfx.squeak(2000); });
        break;
      case 'dance':
        sfx.drumroll(1.0);
        at(1000, () => { sfx.tada(); sfx.cheer(); confetti.cannons(); });
        at(1100, () => setBubble('Party time!'));
        at(3600, () => setBubble(''));
        break;
      case 'cakeIn':
        setSawCake(true);
        setLit(true);
        at(0, () => { sfx.whoosh(); setBubble('CAKE!!'); });
        at(1200, () => sfx.squeak(1500));
        break;
      case 'sneeze':
        at(0, () => setBubble('Mmm… smells so good…'));
        at(400, () => sfx.sneeze());
        at(700, () => { setSub(1); setBubble('Ah…'); });
        at(1400, () => { setSub(2); setBubble('Ahhh…'); });
        at(1900, () => {
          setSub(3);
          setBubble('ACHOO!!');
          setLit(false);
          setHat('fly');
          sfx.blow();
          confetti.burst({ x: 0.52, y: 0.6, count: 40, angle: -20, spread: 70, power: 1, colors: ['#fff', '#ffd0e2', '#ff8fb1'] });
        });
        break;
      case 'icing':
        at(0, () => { setHat('none'); setBubble('…'); sfx.womp(); });
        at(1300, () => { setSub(1); setBubble('Worth it.'); sfx.munch(); });
        at(2100, () => { sfx.chime(988); confetti.burst({ x: 0.4, y: 0.6, count: 24, spread: 120, power: 0.7, emojis: ['🎂', '✨'], ttl: 2.6 }); });
        break;
      case 'card':
        setHat('none');
        at(0, () => { sfx.tada(); sfx.cheer(); confetti.rain({ duration: 4800 }); });
        at(500, () => sfx.rimshot());
        break;
      default:
    }
    return () => T.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const face = faceFor(id, sub);
  const m = motionFor(id, sub);
  const icing = (id === 'sneeze' && sub >= 3) || id === 'icing';
  const x = id === 'walk' || id === 'slip' || id === 'dizzy' ? 36 : id === 'cakeIn' || id === 'sneeze' || id === 'icing' ? -26 : 0;
  const bubbleLeft = x < 0 ? '40%' : x > 0 ? '66%' : '50%';
  const showPeel = id === 'bananaIn' || id === 'walk' || id === 'slip' || id === 'dizzy';
  const showTable = id === 'cakeIn' || id === 'sneeze' || id === 'icing';
  const tableOut = id === 'card' && sawCake;
  const showFrame = past('photo');
  const wall = past('dance') || (id === 'photo' && sub >= 1 && false);
  const disco = id === 'dance';

  let bodyAnim;
  if (id === 'peek') bodyAnim = { animation: 'tedPeek 3.2s cubic-bezier(0.3,0.8,0.4,1) both' };
  else if (id === 'walk') bodyAnim = { animation: 'tedHop 0.5s ease-in-out 3' };
  else if (id === 'slip') bodyAnim = { animation: 'tedSlip 1.6s ease-in-out both' };
  else if (id === 'dance') bodyAnim = sw({ '--x0': '-3px', '--x1': '3px', '--a0': '-3deg', '--a1': '3deg', '--y0': '0px', '--y1': '-4px' }, 0.6);
  else if (id === 'sneeze' && sub === 3) bodyAnim = { animation: 'tedRecoil 0.5s ease-out both' };
  else if (id === 'card') bodyAnim = sw({ '--y0': '0px', '--y1': '-6px' }, 0.5);
  else bodyAnim = { animation: 'tedSwing 2.6s ease-in-out infinite', '--sy0': 1, '--sy1': 1.015, '--sx0': 1, '--sx1': 0.99 };

  const bodyOrigin = { transformOrigin: '100px 240px', ...bodyAnim };

  const tapBear = () => {
    const picks = [
      () => sfx.squeak(1400),
      () => sfx.boing(),
      () => sfx.honk(),
      () => sfx.squeak(2000),
    ];
    picks[poke.n % picks.length]();
    const lines = ['Hehe! That tickles!', 'Boop!', 'Hey, personal space!', 'Again, again!', 'Stop it… 😂'];
    setPoke((p) => ({ n: p.n + 1, text: lines[p.n % lines.length] }));
    setBubble(lines[poke.n % lines.length]);
    setTimeout(() => alive.current && setBubble((b) => (b === lines[poke.n % lines.length] ? '' : b)), 1400);
  };

  const msgSize = w.message.length > 200 ? 3.3 : w.message.length > 120 ? 3.7 : 4.1;

  return (
    <Stage className="bg-[#ffe9ef] text-[#3a1d0f]">
      {/* wall */}
      <div className="absolute inset-x-0 top-0 h-[72%]" style={{ background: 'repeating-linear-gradient(90deg, #ffdbe6 0 9cqmin, #ffeef3 9cqmin 18cqmin)' }} />
      <div className="absolute inset-x-0 top-0 h-[72%] opacity-70" style={{ backgroundImage: 'radial-gradient(#ffb6cb 18%, transparent 20%)', backgroundSize: '10cqmin 10cqmin' }} />
      <div className="absolute inset-x-0 top-[60%] h-[12%] bg-linear-to-b from-[#ffc2d4] to-[#ff9fbc]" />
      <div className="absolute inset-x-0 top-[71.2%] h-[1.4%] bg-[#fff6f0] shadow-[0_0.6cqmin_1cqmin_rgba(120,50,30,0.25)]" />
      {/* floor */}
      <div className="absolute inset-x-0 bottom-0 top-[72.4%]" style={{ background: 'repeating-linear-gradient(90deg, #dca468 0 18cqmin, #c48b52 18cqmin 18.5cqmin), linear-gradient(to bottom, #e8b982, #c48b52)', backgroundBlendMode: 'multiply' }} />
      <div className="absolute inset-x-0 bottom-0 top-[72.4%] bg-linear-to-b from-black/15 to-transparent" />
      <div className="absolute left-1/2 top-[80%] h-[17%] w-[96cqmin] -translate-x-1/2 rounded-[50%] border-[1.6cqmin] border-[#ff8fb1] shadow-[0_1cqmin_2cqmin_rgba(90,30,10,0.3)]" style={{ background: 'repeating-radial-gradient(ellipse at center, #fff0f5 0 4cqmin, #ffc2d4 4cqmin 8cqmin)' }} />

      {/* party lights */}
      <div className="pointer-events-none absolute inset-0 transition-opacity duration-700" style={{ opacity: disco ? 1 : 0 }}>
        <div className="absolute inset-0 animate-spin-slow opacity-50 [animation-duration:12s]" style={{ background: 'repeating-conic-gradient(from 0deg at 50% 52%, #ff5d8f 0 12deg, transparent 12deg 30deg, #5c7cfa 30deg 42deg, transparent 42deg 60deg, #ffb300 60deg 72deg, transparent 72deg 90deg)', transform: 'scale(2)' }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,rgba(255,255,255,0.35),transparent_60%)]" style={{ animation: 'tedBeam 0.6s ease-in-out infinite' }} />
      </div>

      {/* ambient balloons once the party starts */}
      {past('dance') ? (
        <Drift count={9} seed={14} anim="rise" size={[40, 74]} duration={[10, 17]} delay={[0, 6]} prefill={false} sway className="z-[3]">
          {(p) => <Balloon color={p.color} className="w-full" />}
        </Drift>
      ) : null}

      <Board className="pointer-events-none">
        <div className="pointer-events-none absolute inset-0 z-[5]">
          {/* name pennants */}
          {past('photo') ? <Pennants name={NAME} /> : null}

          {/* title */}
          {past('dance') ? (
            <div className="absolute inset-x-[4cqw] top-[15.2%] text-center">
              <SplitText text="Happy Birthday!" stagger={55} anim="pop-in" className="text-[11cqw] font-bold leading-none text-white" letterStyle={(k) => ({ ...comic, fontSize: '11cqw', color: k % 2 ? '#fff' : '#fff2a8', WebkitTextStroke: '1.5cqw #3a1d0f', paintOrder: 'stroke fill', textShadow: '0 1.2cqw 0 rgba(58,29,15,0.3)' })} />
            </div>
          ) : null}

          {/* age balloon */}
          {past('dance') && w.ageText ? (
            <div className="absolute right-[5%] top-[27%] w-[17cqw]" style={{ animation: 'jelly 1s both 0.8s' }}>
              <div className="animate-float-slow">
                <Balloon color="#ff5d8f" label={w.ageText} className="w-full" />
              </div>
            </div>
          ) : null}

          {/* the framed photo: held by the bear, then hung on the wall */}
          {showFrame ? (
            <div className="absolute z-[30]" style={{ left: wall ? '15%' : '50%', top: wall ? '35%' : '57%', width: wall ? '25cqw' : '40cqw', transform: `translate(-50%,-50%) rotate(${wall ? -7 : 2}deg)`, transition: 'all 1s cubic-bezier(0.3,1.1,0.4,1)' }}>
              <div className="pointer-events-auto" style={{ animation: 'tedFrameIn 0.8s cubic-bezier(0.3,1.4,0.5,1) both' }} onPointerDown={() => { sfx.squeak(1800); confetti.burst({ x: 0.2, y: 0.4, count: 14, spread: 100, power: 0.6, gravity: 0.5, emojis: ['💖'], ttl: 2.4 }); }}>
                <Polaroid name={NAME} hold={!wall} />
              </div>
              {!wall ? (
                <>
                  <Paw className="-bottom-[3cqw] -left-[3cqw]" />
                  <Paw className="-bottom-[3cqw] -right-[3cqw]" />
                </>
              ) : null}
            </div>
          ) : null}

          {/* the bear */}
          <div className="pointer-events-auto absolute bottom-[12%] left-1/2 z-[10] w-[66cqw] -ml-[33cqw] cursor-pointer" style={{ transform: `translate(${x}%, ${id === 'card' ? -9 : 0}%)`, transition: id === 'walk' ? 'transform 1.4s linear' : 'transform 0.9s cubic-bezier(0.4,0,0.2,1)' }} onPointerDown={tapBear}>
            <div key={poke.n} style={{ animation: poke.n ? 'squish 0.5s ease-out' : undefined, transformOrigin: '50% 100%' }}>
              <Teddy face={face} hat={hat} icing={icing} m={m} bodyAnim={bodyOrigin} />
            </div>
          </div>

          {/* banana peel + dizzy stars */}
          {showPeel ? (
            <div className="absolute z-[11] w-[24cqw]" style={{ left: '61.8%', top: '84.6%', animation: id === 'bananaIn' ? 'tedFrameIn 0.6s ease-out both' : undefined }}>
              <Peel />
            </div>
          ) : null}
          {id === 'dizzy' ? (
            <div className="pointer-events-none absolute z-[12] h-[16cqw] w-[30cqw] -translate-x-1/2" style={{ left: '73.8%', top: '45.5%' }}>
              <div className="absolute inset-0 animate-spin-slow [animation-duration:1.4s]">
                {['⭐', '💫', '✨', '⭐'].map((s, k) => (
                  <span key={k} className="absolute text-[6.6cqw]" style={{ left: `${50 + 42 * Math.cos((k * Math.PI) / 2)}%`, top: `${50 + 42 * Math.sin((k * Math.PI) / 2)}%`, transform: 'translate(-50%,-50%)' }}>{s}</span>
                ))}
              </div>
            </div>
          ) : null}

          {/* the table and the cake */}
          {showTable || tableOut ? (
            <div className="absolute inset-x-0 top-[67.5%] z-[20] h-[16%]" style={{ animation: `${tableOut ? 'tedTableOut 0.9s ease-in both' : 'tedTableIn 1s cubic-bezier(0.3,1,0.4,1) both'}` }}>
              <div className="absolute inset-x-[3cqw] top-0 h-[7cqw] rounded-[2cqw] bg-gradient-to-b from-[#a8662d] to-[#7d4519] shadow-[0_1cqw_2cqw_rgba(60,25,5,0.35)]" />
              <div className="absolute inset-x-[5cqw] top-[4.4cqw] bottom-0 rounded-b-[3cqw] shadow-[0_2cqw_3cqw_rgba(60,25,5,0.3)]" style={{ background: 'repeating-conic-gradient(#e8344d 0 25%, #fff 0 50%) 0 0 / 9cqw 9cqw' }} />
              <div className="absolute -top-[30cqw] left-[58%] w-[30cqw]">
                <Cake tiers={2} candles={w.age ? Math.min(5, Math.max(1, w.age)) : 4} lit={lit} className="w-full drop-shadow-[0_1.4cqw_2cqw_rgba(60,25,5,0.4)]" />
              </div>
            </div>
          ) : null}

          <Bubble text={bubble} left={bubbleLeft} />

          {/* the greeting card */}
          {id === 'card' ? (
            <div className="absolute inset-x-[6cqw] top-[62.2%] z-[25]" style={{ animation: 'tedCardUp 0.9s cubic-bezier(0.3,1.2,0.4,1) both' }}>
              <div className="relative rounded-[3cqw] border-[0.9cqw] border-white bg-[linear-gradient(135deg,#fffdf6,#fff1f6)] px-[5cqw] pb-[3.6cqw] pt-[3.6cqw] text-center shadow-[0_2cqw_0_rgba(214,90,150,0.4),0_3cqw_6cqw_rgba(60,25,5,0.3)]" style={{ transform: 'rotate(-1deg)' }}>
                <span className="absolute -top-[3cqw] left-1/2 h-[6cqw] w-[24cqw] -translate-x-1/2 rotate-2 bg-yellow-200/90 shadow-sm" />
                <p className="font-script text-[8cqw] leading-none text-[#e0478a]" style={{ fontSize: `min(8cqw, ${fitName(`Dear ${NAME},`, 8, { factor: 0.46, width: 84 })})` }}>Dear {NAME},</p>
                <p className="mt-[2cqw] font-hand font-bold leading-[1.22] text-[#4a2a1a]" style={{ fontSize: `${msgSize}cqw` }}>
                  <Typewriter text={w.message} speed={28} delay={700} cursor={false} />
                </p>
                {w.hasFrom ? <p className="mt-[1.4cqw] font-script text-[6.6cqw] leading-none text-[#e0478a]">— {w.from} 🧸</p> : null}
              </div>
            </div>
          ) : null}
        </div>
      </Board>

      {i < IDX.card ? (
        <button type="button" onPointerDown={() => { setI(IDX.card); sfx.pop(); }} className="absolute bottom-[2.4%] left-[3%] z-[50] cursor-pointer rounded-full bg-white/60 px-[3cqmin] py-[1.2cqmin] font-ui text-[2.8cqmin] font-semibold text-[#3a1d0f]/80">
          Skip to message ›
        </button>
      ) : null}
    </Stage>
  );
}
