import { useEffect, useMemo, useState } from 'react';
import Avatar from '../components/shared/Avatar';
import Board from '../components/shared/Board';
import Drift from '../components/shared/Drift';
import { useTimeline } from '../components/shared/hooks';
import SplitText from '../components/shared/SplitText';
import Stage from '../components/shared/Stage';
import Typewriter from '../components/shared/Typewriter';
import { useWish } from '../components/shared/WishContext';
import { sfx } from '../lib/audio';
import { confetti } from '../lib/confetti';
import { fitName } from '../lib/fit';

const LETTER_COLORS = ['#ff5d8f', '#ff9f1c', '#2ec4b6', '#6c63ff', '#ef476f', '#f4a300', '#06a77d', '#3a86ff'];
const GLASS = 'radial-gradient(circle at 30% 24%, rgba(255,255,255,0.95) 0 5%, rgba(255,255,255,0.3) 14%, rgba(140,235,255,0.22) 60%, rgba(255,255,255,0.55) 100%)';

const FISH = [
  { y: '17%', dir: 'R', dur: 26, delay: -6, size: 21, body: '#ff8a3d', fin: '#ffd29a', hat: '#ff4d8d' },
  { y: '35%', dir: 'L', dur: 32, delay: -13, size: 16, body: '#ffd23f', fin: '#fff0a8', hat: '#3a86ff' },
  { y: '55%', dir: 'R', dur: 29, delay: -21, size: 25, body: '#44d7b6', fin: '#b5f5e6', hat: '#ff9f1c' },
  { y: '68%', dir: 'L', dur: 23, delay: -3, size: 18, body: '#b388ff', fin: '#e0ccff', hat: '#ffd23f' },
  { y: '80%', dir: 'R', dur: 35, delay: -16, size: 14, body: '#ff6b81', fin: '#ffc2cc', hat: '#2ec4b6' },
];

function Fish({ body, fin, hat, flip }) {
  return (
    <svg viewBox="0 0 110 66" className="block w-full overflow-visible" style={{ transform: flip ? 'scaleX(-1)' : undefined }} aria-hidden="true">
      <g style={{ transformBox: 'fill-box', transformOrigin: '0% 50%', animation: 'tailWag 0.5s ease-in-out infinite' }}>
        <path d="M78 34 L108 12 Q103 34 108 56 Z" fill={fin} />
      </g>
      <path d="M36 18 Q50 0 68 14 Z" fill={fin} />
      <ellipse cx="44" cy="35" rx="38" ry="21" fill={body} />
      <path d="M52 15 Q60 35 52 55" stroke="#fff" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.55" />
      <ellipse cx="38" cy="45" rx="22" ry="8" fill="#fff" opacity="0.22" />
      <circle cx="22" cy="30" r="6.5" fill="#fff" />
      <circle cx="20.5" cy="30.5" r="3.2" fill="#12304a" />
      <path d="M10 42 Q18 48 25 42" stroke="#12304a" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M26 14 L40 -8 L48 16 Z" fill={hat} />
      <path d="M29 9 L45 6 M32 3 L43 0" stroke="#fff" strokeWidth="2" opacity="0.7" />
      <circle cx="40" cy="-8" r="3.6" fill="#fff" />
    </svg>
  );
}

function Jelly({ className, hue = '#ff9ad5', delay = 0 }) {
  return (
    <div className={`absolute w-[14cqmin] animate-float-slow ${className}`} style={{ animationDelay: `${delay}s` }}>
      <div className="h-[10cqmin] w-full rounded-t-full" style={{ background: `radial-gradient(ellipse at 40% 25%, #fff 0, ${hue} 45%, rgba(255,255,255,0.15) 100%)`, opacity: 0.8, boxShadow: `0 0 5cqmin ${hue}` }} />
      <div className="flex justify-around px-[1cqw]">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className="block h-[9cqmin] w-[0.8cqmin] origin-top animate-sway rounded-full" style={{ background: hue, opacity: 0.55, animationDelay: `${i * 0.3}s`, animationDuration: '2.6s' }} />
        ))}
      </div>
    </div>
  );
}

function Weed({ left, h, color, delay }) {
  return (
    <svg viewBox="0 0 20 100" className="absolute bottom-[3%] origin-bottom animate-sway" style={{ left: `${left}%`, height: `${h}%`, width: '5.5cqmin', animationDelay: `${delay}s`, animationDuration: '4.5s' }} aria-hidden="true">
      <path d="M10 100 C 2 80, 18 66, 8 46 C 0 28, 14 16, 10 0 C 16 16, 20 30, 12 46 C 4 66, 20 80, 12 100 Z" fill={color} opacity="0.92" />
    </svg>
  );
}

function Coral({ left, color, size }) {
  return (
    <svg viewBox="0 0 60 60" className="absolute bottom-[2%] animate-sway origin-bottom" style={{ left: `${left}%`, width: `${size}cqmin`, animationDuration: '6s' }} aria-hidden="true">
      <path d="M30 60 V28 M30 42 L13 26 M30 34 L47 18 M13 26 V10 M47 18 V6 M30 28 V12" stroke={color} strokeWidth="6.4" strokeLinecap="round" fill="none" />
      <circle cx="13" cy="9" r="3.4" fill="#fff" opacity="0.5" />
      <circle cx="47" cy="5" r="3.4" fill="#fff" opacity="0.5" />
      <circle cx="30" cy="11" r="3.4" fill="#fff" opacity="0.5" />
    </svg>
  );
}

function Whale() {
  return (
    <svg viewBox="0 0 220 90" className="w-[60cqmin]" aria-hidden="true">
      <path d="M8 46 C 20 8, 120 2, 168 30 C 190 40, 200 28, 214 8 C 214 30, 208 46, 216 70 C 200 58, 190 56, 172 60 C 120 84, 30 90, 8 46 Z" fill="#0b3b73" />
      <path d="M26 56 C 70 78, 130 74, 164 58" stroke="#1f6aa5" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.7" />
      <circle cx="44" cy="40" r="3" fill="#bfeaff" opacity="0.8" />
    </svg>
  );
}

function Letter({ ch, d, delay, color }) {
  return (
    <div className="shrink-0" style={{ width: `${d}cqw`, height: `${d}cqw`, animation: 'formUp 1.7s cubic-bezier(0.22,1,0.36,1) both', animationDelay: `${delay}ms` }}>
      <div className="animate-float grid h-full w-full place-items-center rounded-full border border-white/80" style={{ background: GLASS, animationDelay: `${delay % 1700}ms`, animationDuration: '4.2s', boxShadow: 'inset 0 0 3cqw rgba(160,240,255,0.7), 0 0 4cqw rgba(120,220,255,0.45)' }}>
        <span className="font-fredoka font-bold leading-none" style={{ fontSize: `${d * 0.56}cqw`, color, textShadow: '0 0.3cqw 0 rgba(255,255,255,0.8), 0 0.8cqw 1.4cqw rgba(0,40,90,0.25)' }}>
          {ch}
        </span>
      </div>
    </div>
  );
}

export default function DeepSeaParty() {
  const w = useWish();
  const step = useTimeline([300, 3600, 6200]);
  const [chestTapped, setChestTapped] = useState(false);
  const [scroll, setScroll] = useState(false);
  const [wishes, setWishes] = useState(false);
  const [bubbles, setBubbles] = useState([]);
  const [wiggle, setWiggle] = useState({});
  const [avatarHits, setAvatarHits] = useState(0);
  const chestOpen = chestTapped || step >= 3;

  const rows = useMemo(() => ['HAPPY', 'BIRTHDAY'], []);

  useEffect(() => {
    const t = [];
    let k = 0;
    rows.forEach((word, r) => {
      [...word].forEach((_, i) => {
        const delay = (r ? 1400 : 300) + i * (r ? 130 : 150);
        t.push(setTimeout(() => sfx.pop(), delay + 1100));
        k += 1;
      });
    });
    return () => t.forEach(clearTimeout);
  }, [rows]);

  useEffect(() => {
    if (step === 2) sfx.chime(660);
  }, [step]);

  useEffect(() => {
    if (!chestOpen) return;
    sfx.whoosh();
    sfx.coin();
    const t = [
      setTimeout(() => sfx.chime(988), 700),
      setTimeout(() => {
        setScroll(true);
        sfx.tada();
      }, 2500),
      setTimeout(() => {
        setWishes(true);
        sfx.sparkle();
      }, 6200),
    ];
    return () => t.forEach(clearTimeout);
  }, [chestOpen]);

  useEffect(() => {
    let id = 0;
    const iv = setInterval(() => {
      id += 1;
      setBubbles((b) => (b.length >= 7 ? b : [...b, { id: `${id}-${Date.now()}`, x: 6 + Math.random() * 82, size: 9 + Math.random() * 7, dur: 9 + Math.random() * 6 }]));
    }, 1500);
    return () => clearInterval(iv);
  }, []);

  const burst = (e, o) => {
    const r = e.currentTarget.closest('[data-stage]').getBoundingClientRect();
    confetti.burst({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height, ...o });
  };

  const popBubble = (e, id) => {
    e.stopPropagation();
    setBubbles((b) => b.filter((q) => q.id !== id));
    sfx.pop();
    burst(e, { count: 12, spread: 360, power: 0.45, gravity: -0.15, size: 0.8, colors: ['#ffffff', '#bff3ff', '#7fe3ff'], shapes: ['circle'], ttl: 1.6 });
  };

  const tapFish = (e, i) => {
    sfx.pop();
    setWiggle((m) => ({ ...m, [i]: (m[i] || 0) + 1 }));
    burst(e, { count: 12, spread: 120, power: 0.8, gravity: -0.1, emojis: ['🎉', '✨', '🫧'], ttl: 2 });
  };

  const tapChest = (e) => {
    e.stopPropagation();
    setChestTapped(true);
    sfx.coin();
    burst(e, { count: 22, angle: -90, spread: 70, power: 1, emojis: ['🪙', '💎', '✨'], ttl: 2.6 });
  };

  const tapAvatar = (e) => {
    e.stopPropagation();
    setAvatarHits((n) => n + 1);
    sfx.pop();
    burst(e, { count: 22, spread: 360, power: 0.6, gravity: -0.1, size: 0.9, colors: ['#ffffff', '#bff3ff', '#ffd1e8'], shapes: ['circle'], ttl: 1.8 });
  };

  const msgSize = w.message.length > 200 ? 3.7 : w.message.length > 120 ? 4.1 : 4.6;

  return (
    <Stage className="bg-[#06284f] text-white">
      {/* water */}
      <div className="absolute inset-0 bg-linear-to-b from-[#58d8ee] via-[#1688c6] via-35% to-[#04163a]" />
      <div className="pointer-events-none absolute -inset-x-[8%] top-0 h-[55%] opacity-30 [animation:drift2_9s_ease-in-out_infinite_alternate]" style={{ backgroundImage: 'radial-gradient(ellipse at 30% 40%, rgba(255,255,255,0.8) 0, transparent 22%), radial-gradient(ellipse at 70% 60%, rgba(255,255,255,0.7) 0, transparent 20%)', backgroundSize: '28cqmin 22cqmin, 34cqmin 26cqmin', maskImage: 'linear-gradient(to bottom, #000, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, #000, transparent)' }} />
      {[8, 26, 47, 66, 86].map((x, i) => (
        <div key={x} className="pointer-events-none absolute top-[-8%] h-[85%] origin-top animate-sway" style={{ left: `${x}%`, width: `${7 + (i % 3) * 4}cqmin`, background: 'linear-gradient(to bottom, rgba(255,255,255,0.32), rgba(255,255,255,0))', clipPath: 'polygon(30% 0, 70% 0, 100% 100%, 0 100%)', animationDuration: `${7 + i}s`, animationDelay: `${-i * 1.3}s` }} />
      ))}

      <div className="pointer-events-none absolute left-0 top-[24%] animate-[driftX_90s_linear_infinite] opacity-20 [animation-delay:-30s]">
        <Whale />
      </div>

      <Drift count={28} anim="twinkle" size={[2, 5]} duration={[3, 7]} colors={['#ffffff', '#bff3ff']} className="opacity-70">
        {(p) => <span className="block h-full w-full rounded-full" style={{ background: p.color }} />}
      </Drift>
      <Drift count={16} seed={5} anim="rise" size={[6, 16]} duration={[10, 20]} sway className="opacity-80">
        {() => <span className="block aspect-square w-full rounded-full border border-white/60" style={{ background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.7), rgba(255,255,255,0.05) 60%)' }} />}
      </Drift>

      {/* fish behind the content */}
      {FISH.map((f, i) => (
        <div key={i} className="absolute left-0 z-[2]" style={{ top: f.y, animation: `${f.dir === 'R' ? 'swimR' : 'swimL'} ${f.dur}s linear infinite`, animationDelay: `${f.delay}s` }}>
          <div className="animate-float" style={{ animationDuration: `${3 + i * 0.4}s`, animationDelay: `${-i}s` }}>
            <button type="button" key={wiggle[i] || 0} aria-label="Party fish" onPointerDown={(e) => tapFish(e, i)} className="block cursor-pointer" style={{ width: `${f.size}cqmin`, animation: wiggle[i] ? 'squish 0.6s ease-out' : undefined }}>
              <Fish body={f.body} fin={f.fin} hat={f.hat} flip={f.dir === 'R'} />
            </button>
          </div>
        </div>
      ))}

      {/* sea floor */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-[14%]">
        <Weed left={2} h={78} color="#1f9e6b" delay={0} />
        <Weed left={7} h={56} color="#2cc08a" delay={-1.2} />
        <Weed left={78} h={66} color="#23a877" delay={-2} />
        <Weed left={86} h={88} color="#1b8f63" delay={-0.6} />
        <Weed left={93} h={60} color="#2cc08a" delay={-3} />
        <Coral left={30} color="#ff7aa8" size={13} />
        <Coral left={60} color="#ffa94d" size={11} />
        <Coral left={70} color="#b388ff" size={9} />
        <div className="absolute inset-x-[-20%] bottom-[-60%] h-[110%] rounded-[50%] bg-linear-to-b from-[#f0d59a] to-[#b98f55]" />
        <span className="absolute bottom-[8%] left-0 animate-[driftX_60s_linear_infinite] text-[7cqmin] [animation-delay:-18s]" aria-hidden="true">🦀</span>
      </div>

      {/* the page */}
      <div className="pointer-events-none absolute inset-0 z-[10]">
        <Board className="pointer-events-none">
          {/* title */}
          <div className="absolute inset-x-0 top-[6.8%] flex flex-col items-center gap-[1.2cqw]">
            {rows.map((word, r) => (
              <div key={word} className="flex justify-center gap-[0.9cqw]">
                {[...word].map((ch, i) => (
                  <Letter key={i} ch={ch} d={r ? 10.6 : 15} delay={(r ? 1400 : 300) + i * (r ? 130 : 150)} color={LETTER_COLORS[(i + r * 3) % LETTER_COLORS.length]} />
                ))}
              </div>
            ))}
          </div>

          {/* name */}
          {step >= 2 ? (
            <div className="absolute inset-x-[6cqw] top-[23.2%] text-center">
              <SplitText text={w.name} stagger={60} anim="pop-in" className="font-fredoka font-bold leading-none text-white" letterStyle={() => ({ fontSize: fitName(w.name, 13, { factor: 0.58, width: 84 }), textShadow: '0 0 5cqw rgba(160,240,255,0.9), 0 0.6cqw 0 rgba(0,70,130,0.5)' })} />
            </div>
          ) : null}

          {/* avatar bubble */}
          {step >= 2 ? (
            <div className="absolute left-1/2 top-[31.6%] h-[38cqw] w-[40cqw] -translate-x-1/2 animate-pop-in">
              <div className="animate-float-slow h-full w-full">
                <div key={avatarHits} className="pointer-events-auto relative h-full w-full cursor-pointer" style={{ animation: avatarHits ? 'squish 0.7s ease-out' : undefined }} onPointerDown={tapAvatar}>
                  <div className="h-full w-full rounded-full border border-white/80 p-[2.4cqw]" style={{ background: GLASS, boxShadow: 'inset 0 0 6cqw rgba(160,240,255,0.6), 0 0 9cqw rgba(120,220,255,0.55)' }}>
                    <div className="h-full w-full overflow-hidden rounded-full">
                      <Avatar className="h-full w-full" fallbackClassName="bg-gradient-to-br from-[#ff9ad5] via-[#b388ff] to-[#4dc9ff]" textClassName="font-fredoka font-bold text-white" />
                    </div>
                  </div>
                  <div className="absolute left-[14%] top-[7%] h-[13%] w-[28%] -rotate-[28deg] rounded-full bg-white/70 blur-[0.4cqw]" />
                  {w.ageText ? (
                    <div className="absolute -bottom-[1cqw] -right-[1.5cqw] grid h-[13.5cqw] w-[13.5cqw] place-items-center rounded-full font-fredoka text-[6.4cqw] font-bold text-[#b03a73] shadow-lg" style={{ background: 'radial-gradient(circle at 32% 28%, #fff 0, #ffe3ef 45%, #e7a7c7 100%)' }}>
                      {w.ageText}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {/* message scroll */}
          <div className="absolute left-1/2 top-[52.5%] h-[23%] w-[84cqw] -translate-x-1/2">
            {scroll ? (
              <>
                <div className="absolute inset-x-0 top-[1.4cqw] bottom-[1.4cqw] overflow-hidden bg-linear-to-b from-[#f7e7bd] to-[#e8cb8d] shadow-[0_1.4cqw_3cqw_rgba(0,30,70,0.5)]" style={{ animation: 'scrollOpen 1.4s cubic-bezier(0.3,0.9,0.4,1) both' }}>
                  <div className="flex h-full flex-col justify-center px-[6cqw] py-[3cqw] font-hand font-bold text-[#4a3320]">
                    <p className="leading-[1.18]" style={{ fontSize: `${msgSize}cqw` }}>
                      <Typewriter text={w.message} speed={26} delay={900} cursor={false} />
                    </p>
                    {w.hasFrom ? <p className="mt-[1.2cqw] text-right text-[5cqw] text-[#b03a4f]">— {w.from}</p> : null}
                  </div>
                </div>
                <div className="absolute inset-x-[-1.2cqw] top-0 h-[3.2cqw] rounded-full bg-linear-to-b from-[#a8743c] via-[#d9a566] to-[#8a5a2b] shadow-md" />
                <div className="absolute inset-x-[-1.2cqw] bottom-0 h-[3.2cqw] rounded-full bg-linear-to-b from-[#a8743c] via-[#d9a566] to-[#8a5a2b] shadow-md" style={{ animation: 'rollDown 1.4s cubic-bezier(0.3,0.9,0.4,1) both' }} />
              </>
            ) : null}
          </div>

          {/* wishes as shells */}
          <div className="absolute inset-x-[4cqw] top-[77.4%] flex justify-between">
            {w.wishes.map((x, i) => (
              <div key={i} className="w-[29.5cqw]" style={{ opacity: wishes ? 1 : 0, transform: wishes ? 'none' : 'translateY(4cqw) scale(0.6)', transition: `all 0.7s cubic-bezier(0.3,1.4,0.5,1) ${i * 220}ms` }}>
                <div className="flex h-[16.5cqw] items-end justify-center px-[1.6cqw] pb-[1.8cqw] text-center font-fredoka text-[2.8cqw] font-medium leading-[1.12] text-[#7a2d52] shadow-lg" style={{ background: `repeating-conic-gradient(from -58deg at 50% 118%, ${['#ffd9e4', '#ffe1c4', '#e6d8ff'][i]} 0 8deg, ${['#ffbdd2', '#ffc99c', '#d2bcff'][i]} 8deg 16deg)`, borderRadius: '50% 50% 10% 10% / 85% 85% 10% 10%', animation: wishes ? `float 4.5s ease-in-out ${i * 0.6}s infinite` : undefined }}>
                  <span>{x}</span>
                </div>
              </div>
            ))}
          </div>

          {/* treasure chest */}
          <div className="pointer-events-auto absolute left-[4cqw] top-[88.4%] w-[24cqw] cursor-pointer" onPointerDown={tapChest} role="button" tabIndex={0} aria-label="Treasure chest">
            {chestOpen ? <div className="pointer-events-none absolute -top-[8cqw] left-1/2 h-[18cqw] w-[26cqw] -translate-x-1/2 animate-pulse-glow" style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(255,236,150,0.95), transparent 65%)' }} /> : null}
            <div className="relative h-[17cqw] w-full">
              {/* gold inside */}
              <div className="absolute bottom-[8cqw] left-[1.6cqw] right-[1.6cqw] h-[5cqw] rounded-t-[50%] transition-opacity duration-700" style={{ opacity: chestOpen ? 1 : 0, background: 'radial-gradient(circle at 30% 40%, #fff3b0 0, #ffcf3d 40%, #c98a10 100%)' }} />
              {/* lid */}
              <div className="absolute inset-x-0 bottom-[8cqw] h-[8cqw] origin-bottom transition-transform duration-1000 ease-[cubic-bezier(0.3,1.4,0.5,1)]" style={{ transform: chestOpen ? 'perspective(40cqw) rotateX(78deg)' : 'none' }}>
                <div className="h-full w-full rounded-t-[4cqw] border-[0.7cqw] border-[#4b2a12] bg-linear-to-b from-[#a8662d] to-[#7d4519]">
                  <span className="absolute inset-y-0 left-[18%] w-[2.2cqw] bg-linear-to-r from-[#e9b94b] to-[#b8862b]" />
                  <span className="absolute inset-y-0 right-[18%] w-[2.2cqw] bg-linear-to-r from-[#e9b94b] to-[#b8862b]" />
                </div>
              </div>
              {/* body */}
              <div className="absolute inset-x-0 bottom-0 h-[8.4cqw] rounded-b-[1.2cqw] border-[0.7cqw] border-[#4b2a12] bg-linear-to-b from-[#8a5224] to-[#5d3414]">
                <span className="absolute inset-y-0 left-[18%] w-[2.2cqw] bg-linear-to-r from-[#e9b94b] to-[#b8862b]" />
                <span className="absolute inset-y-0 right-[18%] w-[2.2cqw] bg-linear-to-r from-[#e9b94b] to-[#b8862b]" />
                <span className="absolute -top-[1.8cqw] left-1/2 h-[3.6cqw] w-[3.2cqw] -translate-x-1/2 rounded-sm bg-gradient-to-b from-[#ffe08a] to-[#b8862b]" />
              </div>
            </div>
            {!chestOpen ? <p className="pointer-events-none absolute left-[2cqw] top-[18cqw] whitespace-nowrap text-[2.6cqw] font-semibold text-white/80 animate-pulse">tap me!</p> : null}
          </div>

          {/* message in a bottle */}
          {chestOpen && !scroll ? (
            <svg viewBox="0 0 40 90" className="pointer-events-none absolute left-[13cqw] top-[85%] z-10 w-[11cqw]" style={{ '--tx': '28cqw', '--ty': '-30cqh', animation: 'bottleRise 2.5s ease-in-out both' }} aria-hidden="true">
              <rect x="15" y="2" width="10" height="10" rx="2" fill="#c98a4b" />
              <path d="M14 12 H26 V24 C26 30 36 34 36 46 V80 C36 86 32 88 28 88 H12 C8 88 4 86 4 80 V46 C4 34 14 30 14 24 Z" fill="rgba(190,245,255,0.5)" stroke="#e8fbff" strokeWidth="1.6" />
              <rect x="13" y="46" width="14" height="32" rx="3" fill="#f7e7bd" transform="rotate(-6 20 62)" />
              <path d="M16 54 H25 M16 60 H25 M16 66 H23" stroke="#b8862b" strokeWidth="1.2" />
              <path d="M9 40 V82" stroke="#fff" strokeWidth="2" opacity="0.6" strokeLinecap="round" />
            </svg>
          ) : null}
        </Board>
      </div>

      {/* tappable bubbles */}
      <div className="absolute inset-0 z-[20] overflow-hidden" style={{ pointerEvents: 'none' }}>
        {bubbles.map((b) => (
          <div key={b.id} className="absolute top-0" style={{ left: `${b.x}%`, width: `${b.size}cqmin`, animation: `riseUp ${b.dur}s linear both` }} onAnimationEnd={() => setBubbles((q) => q.filter((z) => z.id !== b.id))}>
            <button type="button" aria-label="Pop the bubble" onPointerDown={(e) => popBubble(e, b.id)} className="pointer-events-auto block aspect-square w-full cursor-pointer rounded-full border border-white/70" style={{ background: GLASS, boxShadow: 'inset 0 0 1.6cqmin rgba(160,240,255,0.7)' }} />
          </div>
        ))}
      </div>

      <Jelly className="left-[3%] top-[41%] z-[4]" hue="#ff9ad5" />
      <Jelly className="right-[2%] top-[62%] z-[4] scale-90" hue="#b9a0ff" delay={-2} />
    </Stage>
  );
}
