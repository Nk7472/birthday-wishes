import { useEffect, useState } from 'react';
import Avatar from '../components/shared/Avatar';
import Board from '../components/shared/Board';
import Drift from '../components/shared/Drift';
import Reveal from '../components/shared/Reveal';
import Stage from '../components/shared/Stage';
import Typewriter from '../components/shared/Typewriter';
import { useWish } from '../components/shared/WishContext';
import { BRAND } from '../config';
import { sfx } from '../lib/audio';
import { confetti } from '../lib/confetti';
import { fitName } from '../lib/fit';

// 0-2 countdown leader, 3-5 taglines, 6 studio card, 7 title, 8 poster, 9 credits, 10 the end
const DUR = [1000, 1000, 1000, 2100, 2100, 2300, 3000, 5600, 4800, 23500];
const LAST = DUR.length;
const GOLD_TEXT = 'linear-gradient(180deg, #fff6cf 0%, #ffd35e 45%, #b8862b 100%)';
const NOISE = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.7'/></svg>")`;
const cinzel = 'font-cinzel';

function Role({ label, children }) {
  return (
    <div className="mb-[10cqw] text-center">
      <p className={`${cinzel} text-[3cqw] uppercase tracking-[0.42em] text-[#c9a24a]`}>{label}</p>
      <div className="mt-[2cqw] font-playfair text-[5.6cqw] leading-tight text-white">{children}</div>
    </div>
  );
}

export default function MoviePremiere() {
  const w = useWish();
  const [scene, setScene] = useState(0);
  const NAME = w.name.toUpperCase();

  useEffect(() => {
    const d = DUR[scene];
    if (d == null) return;
    const t = setTimeout(() => setScene((s) => s + 1), d);
    return () => clearTimeout(t);
  }, [scene]);

  useEffect(() => {
    if (scene <= 2) sfx.tick();
    else if (scene <= 5) sfx.whoosh();
    else if (scene === 6) sfx.chime(523);
    else if (scene === 7) {
      sfx.boom();
      sfx.chime(659);
      confetti.stars();
    } else if (scene === 8) sfx.sparkle();
    else if (scene === 10) {
      sfx.tada();
      confetti.rain({ duration: 3800, colors: ['#ffd35e', '#fff6cf', '#c9a24a', '#ffffff'] });
    }
  }, [scene]);

  const skip = () => {
    setScene((s) => Math.min(LAST, s + 1));
    sfx.pop();
  };

  const tag = [
    'THIS YEAR…',
    w.age ? `${w.age} YEARS IN THE MAKING…` : 'YEARS IN THE MAKING…',
    'ONE HERO RISES.',
  ];
  const msgSize = w.message.length > 200 ? 3.7 : w.message.length > 120 ? 4.1 : 4.5;

  return (
    <Stage className="bg-black text-white">
      {/* backgrounds */}
      {scene <= 2 ? <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#e3dcc4_0%,#cfc7ad_55%,#9e9679_100%)]" /> : null}
      {scene >= 3 && scene <= 6 ? <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_44%,rgba(255,255,255,0.1),transparent_58%)]" /> : null}
      {scene >= 7 && scene <= 8 ? <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_46%,#1d2d5c_0%,#0b1128_55%,#02040a_100%)]" /> : null}
      {scene >= 9 ? <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#15110a_0%,#000_70%)]" /> : null}
      {scene >= 7 && scene <= 8 ? (
        <Drift count={30} seed={6} anim="twinkle" size={[2, 5]} duration={[2, 5]} colors={['#ffe9a8', '#ffffff', '#ffd35e']} className="z-[2]">
          {(p) => <span className="block h-full w-full rounded-full" style={{ background: p.color, boxShadow: `0 0 ${p.size * 2}px ${p.color}` }} />}
        </Drift>
      ) : null}

      {/* scenes */}
      <div className="absolute inset-0 z-[5]">
        <Board className="pointer-events-none">
          {/* leader */}
          {scene <= 2 ? (
            <div className="absolute inset-0 grid place-items-center">
              <div className="relative grid h-[74cqw] w-[74cqw] place-items-center rounded-full border-[0.9cqw] border-[#3b3730]/70">
                <div className="absolute h-[54cqw] w-[54cqw] rounded-full border-[0.6cqw] border-[#3b3730]/60" />
                <div className="absolute h-px w-[96%] bg-[#3b3730]/60" />
                <div className="absolute h-[96%] w-px bg-[#3b3730]/60" />
                <div className="absolute inset-[2%] rounded-full" style={{ background: 'conic-gradient(from 0deg, rgba(59,55,48,0.4), rgba(59,55,48,0) 30%)', animation: 'sweepSpin 1s linear infinite' }} />
                <span key={scene} className={`${cinzel} relative animate-pop-in text-[42cqw] font-bold leading-none text-[#3b3730] [animation-duration:0.35s]`}>{3 - scene}</span>
              </div>
            </div>
          ) : null}

          {/* taglines */}
          {scene >= 3 && scene <= 5 ? (
            <div key={scene} className="absolute inset-x-[8cqw] top-[40%] text-center" style={{ animation: 'slowZoom 2.6s linear both' }}>
              <Reveal anim="fade-in" duration={700}>
                <p className={`${cinzel} leading-[1.5] tracking-[0.3em]`} style={{ fontSize: scene === 5 ? '7.4cqw' : '5.4cqw', color: scene === 5 ? '#ffd35e' : '#fff' }}>{tag[scene - 3]}</p>
              </Reveal>
            </div>
          ) : null}

          {/* studio card */}
          {scene === 6 ? (
            <div className="absolute inset-x-[8cqw] top-[36%] text-center">
              <Reveal anim="fade-in" duration={900}>
                <svg viewBox="0 0 40 40" className="mx-auto mb-[5cqw] h-[16cqw] w-[16cqw]" aria-hidden="true">
                  <circle cx="20" cy="20" r="18" fill="none" stroke="#ffd35e" strokeWidth="1.2" />
                  <path d="M20 6 L23.5 16 L34 16.5 L25.7 23 L28.6 33 L20 27 L11.4 33 L14.3 23 L6 16.5 L16.5 16 Z" fill="#ffd35e" />
                </svg>
                <p className={`${cinzel} font-semibold tracking-[0.2em] text-[#ffd35e]`} style={{ fontSize: fitName(w.hasFrom ? w.from.toUpperCase() : BRAND.toUpperCase(), 8.4, { factor: 0.95, width: 82 }) }}>{w.hasFrom ? w.from.toUpperCase() : BRAND.toUpperCase()}</p>
                <p className="mt-[3cqw] font-playfair text-[5cqw] italic text-white/80">{w.hasFrom ? 'presents' : 'pictures presents'}</p>
              </Reveal>
            </div>
          ) : null}

          {/* title */}
          {scene === 7 ? (
            <>
              <div className="pointer-events-none absolute -inset-x-[40%] top-[41.4%] h-[1.4cqw] bg-gradient-to-r from-transparent via-sky-200 to-transparent" style={{ animation: 'flareSweep 2s ease-out 0.35s both', boxShadow: '0 0 6cqw 1.4cqw rgba(140,200,255,0.8)' }} />
              <div className="absolute inset-x-[5cqw] top-[33%] text-center">
                <Reveal anim="fade-in" duration={1200} delay={200}>
                  <p className={`${cinzel} text-[3.4cqw] tracking-[0.55em] text-sky-100/80`}>A BIRTHDAY FILM</p>
                </Reveal>
                <Reveal anim="zoom-in" duration={1700} delay={500}>
                  <p className={`${cinzel} mt-[4cqw] font-black leading-none tracking-[0.06em]`} style={{ fontSize: fitName(NAME, 15, { factor: 0.82, width: 84 }), backgroundImage: GOLD_TEXT, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: 'drop-shadow(0 0 3cqw rgba(255,200,80,0.55))' }}>{NAME}</p>
                </Reveal>
                <Reveal anim="fade-up" duration={1200} delay={1600}>
                  <p className={`${cinzel} mt-[6cqw] text-[8cqw] tracking-[0.3em] text-white`}>{w.age ? `TURNS ${w.age}` : 'THE BIRTHDAY'}</p>
                  {w.age ? <p className={`${cinzel} mt-[2cqw] text-[3.6cqw] tracking-[0.55em] text-[#ffd35e]`}>THE BIRTHDAY</p> : null}
                </Reveal>
              </div>
            </>
          ) : null}

          {/* poster */}
          {scene === 8 ? (
            <div className="absolute inset-x-0 top-[13%] flex flex-col items-center" style={{ animation: 'slowZoom 5.4s linear both' }}>
              <Reveal anim="fade-in" duration={900}>
                <p className={`${cinzel} text-[3.8cqw] tracking-[0.2em] text-[#ffd35e]`}>★★★★★ <span className="font-playfair italic tracking-normal text-white/90">“Unforgettable.”</span></p>
              </Reveal>
              <Reveal anim="zoom-in" duration={1100} delay={200} className="relative mt-[3cqw]">
                <div className="rounded-[0.8cqw] p-[1cqw] shadow-[0_0_8cqw_rgba(255,200,80,0.35)]" style={{ width: '62cqw', aspectRatio: '3 / 4', background: 'linear-gradient(135deg,#fff2c2,#c9a24a 45%,#7a5a1a)' }}>
                  <div className="relative h-full w-full overflow-hidden bg-black">
                    <Avatar rounded="rounded-none" className="h-full w-full" fallbackClassName="bg-gradient-to-br from-[#2a3f7a] via-[#5a3a8a] to-[#c0507a]" textClassName="font-cinzel font-black text-white/90" />
                    <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.85),transparent_45%,rgba(0,0,0,0.35))]" />
                    {w.age ? <span className={`${cinzel} absolute left-[3cqw] top-[3cqw] border border-white/70 px-[2cqw] py-[0.6cqw] text-[3cqw] tracking-[0.15em] text-white/90`}>RATED {w.age}+</span> : null}
                    <p className={`${cinzel} absolute inset-x-[2cqw] bottom-[4.4cqw] text-center font-bold leading-none tracking-[0.08em]`} style={{ fontSize: fitName(NAME, 9, { factor: 0.82, width: 52 }), backgroundImage: GOLD_TEXT, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{NAME}</p>
                  </div>
                </div>
              </Reveal>
              <Reveal anim="fade-up" duration={1000} delay={900}>
                <p className={`${cinzel} mt-[4cqw] text-[3.4cqw] tracking-[0.34em] text-white/85`}>THE BIRTHDAY OF THE YEAR</p>
              </Reveal>
            </div>
          ) : null}

          {/* credits */}
          {scene === 9 ? (
            <div className="absolute inset-x-0 bottom-[11%] top-[11%] overflow-hidden">
              <div className="absolute inset-x-[8cqw] top-full pb-[10cqw]" style={{ animation: 'creditsUp 23s linear both' }}>
                <Role label="Starring"><span className={`${cinzel} font-bold text-[#ffd35e]`} style={{ fontSize: fitName(NAME, 9, { factor: 0.82, width: 76 }) }}>{NAME}</span><span className="mt-[1.4cqw] block text-[4cqw] italic text-white/70">as themselves</span></Role>
                <Role label="Directed with love by">{w.hasFrom ? w.from : 'Everyone who adores you'}</Role>
                <Role label="Special thanks for">
                  {w.wishes.map((x, i) => <span key={i} className="mb-[3cqw] block text-[4.6cqw] italic text-white/90">✦ {x}</span>)}
                </Role>
                <Role label="Cake">A very large slice</Role>
                <Role label="Candles">{w.age ? `${w.age}, all blown out safely` : 'Several, all blown out safely'}</Role>
                <Role label="Filmed on location">Another trip around the sun</Role>
                <p className="mb-[16cqw] text-center font-playfair text-[3.4cqw] italic text-white/50">No party hats were harmed in the making of this birthday.</p>
              </div>
            </div>
          ) : null}

          {/* the end + post-credits scene */}
          {scene >= LAST ? (
            <div className="absolute inset-x-[6cqw] top-[20%] text-center">
              <Reveal anim="zoom-in" duration={1400}>
                <p className={`${cinzel} text-[13cqw] font-bold leading-none tracking-[0.18em]`} style={{ backgroundImage: GOLD_TEXT, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>THE END</p>
                <p className="mt-[3cqw] font-playfair text-[4.4cqw] italic text-white/75">(of another amazing year)</p>
              </Reveal>
              <Reveal anim="fade-up" duration={1400} delay={2200} className="mt-[11cqw]">
                <p className={`${cinzel} mb-[3cqw] text-[2.8cqw] tracking-[0.5em] text-[#c9a24a]`}>POST-CREDITS SCENE</p>
                <div className="flex min-h-[34cqw] flex-col justify-center rounded-[1.4cqw] border border-[#c9a24a]/50 bg-white/5 px-[5cqw] py-[3cqw]">
                  <p className="font-playfair italic leading-[1.35] text-white" style={{ fontSize: `${msgSize}cqw` }}>
                    <Typewriter text={w.message} speed={30} delay={3400} cursor={false} />
                  </p>
                  {w.hasFrom ? <p className={`${cinzel} mt-[2cqw] text-[3.4cqw] tracking-[0.3em] text-[#ffd35e]`}>— {w.from.toUpperCase()}</p> : null}
                </div>
              </Reveal>
            </div>
          ) : null}
        </Board>
      </div>

      {/* tap to skip */}
      <div className="absolute inset-0 z-[35]" onPointerDown={skip} />

      {/* cinema overlays */}
      <div className="pointer-events-none absolute inset-0 z-[30] overflow-hidden">
        <div className="absolute -inset-[50%] opacity-[0.1] [animation:grain_0.7s_steps(6)_infinite]" style={{ backgroundImage: NOISE }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_48%,rgba(0,0,0,0.75)_100%)]" />
        <div className="absolute inset-0 bg-white [animation:filmFlicker_3.1s_infinite]" />
        <span className="absolute inset-y-0 left-[23%] w-px animate-flicker bg-white/25" />
        <span className="absolute inset-y-0 left-[71%] w-px animate-flicker bg-white/15 [animation-delay:0.6s]" />
        {scene === 7 ? <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_41%,rgba(150,200,255,0.35),transparent_40%)] animate-flash [animation-duration:2.4s]" /> : null}
      </div>
      {scene === 3 || scene === 7 ? <div key={scene} className="pointer-events-none absolute inset-0 z-[36] animate-flash bg-white [animation-duration:0.7s]" /> : null}

      {/* letterbox */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[40] h-[11%] bg-black" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[40] h-[11%] bg-black" />
      <div className="pointer-events-none absolute inset-x-0 top-[11%] z-[40] h-px bg-[#c9a24a]/30" />
      <div className="pointer-events-none absolute inset-x-0 bottom-[11%] z-[40] h-px bg-[#c9a24a]/30" />
      {scene < 9 ? <p className="pointer-events-none absolute bottom-[4%] left-[4%] z-[41] font-ui text-[2.6cqmin] tracking-wider text-white/35">tap to skip ›</p> : null}
    </Stage>
  );
}
