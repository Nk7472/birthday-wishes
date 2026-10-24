import { useCallback, useEffect, useRef, useState } from 'react';
import Avatar from '../components/shared/Avatar';
import Balloon from '../components/shared/Balloon';
import Board from '../components/shared/Board';
import Cake from '../components/shared/Cake';
import Drift from '../components/shared/Drift';
import { useTimeline } from '../components/shared/hooks';
import Reveal from '../components/shared/Reveal';
import SplitText from '../components/shared/SplitText';
import Stage from '../components/shared/Stage';
import { useWish } from '../components/shared/WishContext';
import { sfx } from '../lib/audio';
import { confetti } from '../lib/confetti';
import { fitName } from '../lib/fit';
import { listenForBlow } from '../lib/mic';

const RING = 'conic-gradient(#ff9a8b, #ffd86f, #8bffc7, #7bb6ff, #d58bff, #ff9a8b)';
const glow = '0 0.3cqw 1.2cqw rgba(110,25,90,0.75)';

export default function MakeAWish() {
  const w = useWish();
  const step = useTimeline([800, 5400, 9800]);
  const [lit, setLit] = useState(true);
  const [blown, setBlown] = useState(false);
  const [hush, setHush] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [mic, setMic] = useState('idle');
  const [wi, setWi] = useState(0);
  const blownRef = useRef(false);
  const stopRef = useRef(null);
  const alive = useRef(true);
  const candles = w.age ? Math.min(9, Math.max(1, w.age)) : 5;

  const blow = useCallback(() => {
    if (blownRef.current) return;
    blownRef.current = true;
    stopRef.current?.();
    stopRef.current = null;
    setBlown(true);
    setLit(false);
    setHush(true);
    sfx.blow();
  }, []);
  const blowRef = useRef(blow);
  blowRef.current = blow;

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      stopRef.current?.();
    };
  }, []);

  // never stall: if nobody blows, the candles gutter on their own
  useEffect(() => {
    const t = setTimeout(() => blowRef.current(), 12000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!blown) return;
    const t = setTimeout(() => {
      setHush(false);
      setCelebrate(true);
    }, 1300);
    return () => clearTimeout(t);
  }, [blown]);

  useEffect(() => {
    if (!celebrate) return;
    sfx.tada();
    confetti.cannons();
    confetti.rain({ duration: 5200 });
    const t = [setTimeout(() => sfx.chime(988), 900), setTimeout(() => sfx.sparkle(), 1800)];
    const iv = setInterval(() => setWi((i) => (i + 1) % 3), 3300);
    return () => {
      t.forEach(clearTimeout);
      clearInterval(iv);
    };
  }, [celebrate]);

  useEffect(() => {
    if (step === 2) sfx.chime(660);
  }, [step]);

  const startMic = async () => {
    setMic('listening');
    const stop = await listenForBlow({ onBlow: () => blowRef.current(), onDenied: () => alive.current && setMic('denied') });
    if (!alive.current || blownRef.current) {
      stop();
      return;
    }
    stopRef.current = stop;
  };

  const tapCake = (e) => {
    if (!celebrate && !blown) {
      if (step >= 2) blow();
      return;
    }
    if (!celebrate) return;
    const r = e.currentTarget.closest('[data-stage]').getBoundingClientRect();
    if (lit) {
      sfx.blow();
      setLit(false);
    } else {
      sfx.sparkle();
      setLit(true);
      confetti.burst({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height, count: 30, spread: 120, power: 0.9, emojis: ['✨', '🎉', '🎈'], ttl: 2.4 });
    }
  };

  const title = `Happy ${w.ordinal ? `${w.ordinal} ` : ''}Birthday`;
  const msgSize = w.message.length > 200 ? 3.5 : w.message.length > 120 ? 3.9 : 4.3;
  const fade = (on) => ({ opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(2cqw)', transition: 'opacity 1.1s ease, transform 1.1s ease' });

  return (
    <Stage className="bg-[#0b0610] text-white">
      {/* the dark room */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_46%,#2b1630_0%,#150a1c_50%,#07030b_100%)]" />
      <div className="pointer-events-none absolute inset-0 transition-opacity duration-1000" style={{ opacity: lit && !celebrate ? 1 : 0 }}>
        <div className="absolute inset-0 animate-flicker bg-[radial-gradient(circle_at_50%_46%,rgba(255,170,80,0.42),transparent_55%)] [animation-duration:2.6s]" />
      </div>
      <Drift count={16} seed={4} anim="float-slow" size={[18, 70]} duration={[8, 16]} colors={['#ffb86b', '#ff8fb1', '#ffd9a0']} className="opacity-40">
        {(p) => <span className="block aspect-square w-full rounded-full blur-[2px]" style={{ background: `radial-gradient(circle, ${p.color}, transparent 68%)` }} />}
      </Drift>

      {/* the lights come on */}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-[#ffb199] via-[#ff6f91] to-[#6f46d2]" style={{ opacity: celebrate ? 1 : 0, transition: 'opacity 1.6s ease' }} />
      {celebrate ? (
        <>
          <div className="pointer-events-none absolute inset-0 animate-spin-slow opacity-25 [animation-duration:70s]" style={{ background: 'repeating-conic-gradient(from 0deg at 50% 38%, rgba(255,255,255,0.7) 0 5deg, transparent 5deg 15deg)', transform: 'scale(1.8)' }} />
          <Drift count={10} seed={12} anim="rise" size={[40, 76]} duration={[9, 15]} delay={[0, 5]} prefill={false} sway className="z-[5]">
            {(p) => <Balloon color={p.color} className="w-full" />}
          </Drift>
        </>
      ) : null}

      <div className="pointer-events-none absolute inset-0 z-10">
        <Board className="pointer-events-none">
          {/* prompts */}
          <div className="absolute inset-x-[6cqw] top-[10%] text-center" style={fade(step >= 1 && step < 2 && !blown)}>
            <p className="font-script leading-tight text-amber-100" style={{ fontSize: `min(10cqw, ${fitName(`Make a wish, ${w.name}`, 10, { factor: 0.48, width: 86 })})`, textShadow: '0 0 5cqw rgba(255,170,80,0.7)' }}>Make a wish, {w.name}</p>
            <p className="mx-auto mt-[2.4cqw] max-w-[74cqw] font-playfair text-[4.3cqw] italic text-amber-50/80">Close your eyes. Think of something wonderful.</p>
          </div>
          <div className="absolute inset-x-[6cqw] top-[10%] text-center" style={fade(step >= 2 && !blown)}>
            <p className="font-script text-[10cqw] leading-tight text-amber-100" style={{ textShadow: '0 0 5cqw rgba(255,170,80,0.7)' }}>Now blow out the candles</p>
            <p className="mx-auto mt-[2.4cqw] font-playfair text-[4.3cqw] italic text-amber-50/80">Make it count ✨</p>
          </div>

          {/* celebration title + avatar + wishes */}
          {celebrate ? (
            <>
              <div className="absolute inset-x-[4cqw] top-[7.2%] text-center">
                <SplitText text={title} delay={200} stagger={50} anim="pop-in" className="block font-script text-[9cqw] leading-none text-white" letterStyle={() => ({ textShadow: '0 0.6cqw 0 rgba(120,30,90,0.35), 0 0 4cqw rgba(255,255,255,0.6)' })} />
                <SplitText text={`${w.name}!`} delay={900} stagger={60} anim="pop-in" className="mt-[1cqw] block font-script font-bold leading-none text-[#fff3b0]" letterStyle={() => ({ fontSize: fitName(`${w.name}!`, 14, { factor: 0.5, width: 84 }), textShadow: '0 0.6cqw 0 rgba(120,30,90,0.35), 0 0 5cqw rgba(255,230,120,0.8)' })} />
              </div>
              <div className="absolute left-[33%] top-[20.8%] h-[34cqw] w-[34cqw] animate-pop-in [animation-delay:1100ms]">
                <div className="animate-float-slow h-full w-full">
                  <div className="absolute inset-0 animate-spin-slow rounded-full [animation-duration:14s]" style={{ background: RING, boxShadow: '0 0 6cqw rgba(255,255,255,0.55)' }} />
                  <div className="absolute inset-[1.2cqw] overflow-hidden rounded-full border-[1cqw] border-white/90">
                    <Avatar className="h-full w-full" fallbackClassName="bg-gradient-to-br from-[#ff9a8b] to-[#7b4bd8]" textClassName="font-script font-bold text-white" />
                  </div>
                  {w.ageText ? (
                    <div className="absolute -bottom-[1cqw] -right-[1.5cqw] grid h-[12.5cqw] w-[12.5cqw] place-items-center rounded-full border-[0.8cqw] border-white bg-gradient-to-br from-[#ffd86f] to-[#ff8a3d] font-ui text-[6cqw] font-extrabold text-[#6a2a10] shadow-lg">{w.ageText}</div>
                  ) : null}
                </div>
              </div>
              <p key={wi} className="absolute inset-x-[6cqw] top-[40.2%] animate-fade-up text-center font-hand text-[5.2cqw] font-bold text-white" style={{ textShadow: glow }}>✦ {w.wishes[wi]} ✦</p>
            </>
          ) : null}

          {/* the cake */}
          <div
            className="pointer-events-auto absolute left-[19%] top-[27%] w-[62cqw] cursor-pointer"
            onPointerDown={tapCake}
            role="button"
            tabIndex={0}
            aria-label="The birthday cake"
            style={{ transform: celebrate ? 'translateY(23cqw) scale(0.66)' : 'none', transformOrigin: '50% 40%', transition: 'transform 1.6s cubic-bezier(0.3,1.1,0.4,1)' }}
          >
            <Cake tiers={w.age && w.age > 12 ? 3 : 2} candles={candles} lit={lit} colors={celebrate ? undefined : { cake: '#e9a0be', trim: '#d9487e', plate: '#c9b9de' }} className="w-full drop-shadow-[0_2cqw_4cqw_rgba(0,0,0,0.5)]" />
          </div>

          {/* microphone pill + hint (before the blow) */}
          <div className="absolute inset-x-0 top-[63.6%] flex flex-col items-center gap-[1.6cqw]" style={fade(step >= 2 && !blown)}>
            {mic === 'idle' ? (
              <button type="button" onPointerDown={startMic} className="pointer-events-auto cursor-pointer whitespace-nowrap rounded-full border border-amber-200/50 bg-amber-100/10 px-[4.4cqw] py-[1.8cqw] font-ui text-[3.6cqw] font-semibold text-amber-50-[2px]">🎤 Blow into your mic</button>
            ) : mic === 'listening' ? (
              <span className="animate-pulse whitespace-nowrap rounded-full border border-amber-200/60 bg-amber-100/15 px-[4.4cqw] py-[1.8cqw] font-ui text-[3.6cqw] font-semibold text-amber-50">🎤 Listening… go on, blow!</span>
            ) : (
              <span className="font-ui text-[3.2cqw] text-amber-50/70">Mic isn’t available here</span>
            )}
            <span className="font-ui text-[3cqw] text-amber-50/60">{mic === 'denied' ? 'Just tap the cake instead' : 'or just tap the cake'}</span>
          </div>

          {/* message */}
          {step >= 3 ? (
            <Reveal anim="fade-up" duration={1400} className="absolute inset-x-[7cqw] top-[71.4%]">
              <div className="flex h-[32cqw] flex-col justify-center rounded-[3cqw] border border-white/20 bg-white/10 px-[5cqw] py-[2cqw] text-center shadow-[0_0_6cqw_rgba(0,0,0,0.25)]-[2px]">
                <p className="font-playfair italic leading-[1.3] text-white" style={{ fontSize: `${msgSize}cqw` }}>{w.message}</p>
                {w.hasFrom ? <p className="mt-[1.4cqw] font-script text-[6cqw] leading-none text-[#fff3b0]">— {w.from}</p> : null}
              </div>
            </Reveal>
          ) : null}
        </Board>
      </div>

      {/* the hush */}
      {hush ? <div className="pointer-events-none absolute inset-0 z-30 bg-black" style={{ animation: 'hush 1.3s ease-in-out both' }} /> : null}
    </Stage>
  );
}
