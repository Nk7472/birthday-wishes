import { useEffect, useState } from 'react';
import Avatar from '../components/shared/Avatar';
import Board from '../components/shared/Board';
import Drift from '../components/shared/Drift';
import Reveal from '../components/shared/Reveal';
import Stage from '../components/shared/Stage';
import Typewriter from '../components/shared/Typewriter';
import { useWish } from '../components/shared/WishContext';
import { sfx } from '../lib/audio';
import { confetti } from '../lib/confetti';
import { fitName } from '../lib/fit';
import { msgSize, togetherText } from '../lib/love';

const PAPER = { background: 'linear-gradient(90deg, #ecdcc4 0, #fffaf0 5%, #fffaf0 100%)' };
const NUMS = ['I', 'II', 'III'];
const ART = ['💞', '🌹', '✨'];

function Page({ i, page, z, children, style, className = '' }) {
  const turned = i < page;
  return (
    <div
      className={`absolute inset-0 overflow-hidden rounded-r-[3cqw] rounded-l-[0.8cqw] shadow-[0_2cqw_6cqw_rgba(0,0,0,0.45)] ${className}`}
      style={{ zIndex: z, transformOrigin: '0 50%', animation: turned ? 'pageTurn 0.95s var(--ease-out) both' : 'none', visibility: i < page - 1 ? 'hidden' : 'visible', willChange: 'transform', ...style }}
    >
      {children}
    </div>
  );
}

export default function LoveStory() {
  const w = useWish();
  const [page, setPage] = useState(0);
  const LAST = 4;
  const together = togetherText(w);

  const turn = () => {
    setPage((p) => {
      if (p >= LAST) return p;
      sfx.whoosh();
      if (p === LAST - 1) confetti.burst({ x: 0.5, y: 0.45, count: 22, spread: 360, power: 0.5, gravity: 0.25, emojis: ['💖', '✨'], size: 1.2, ttl: 2.6 });
      return p + 1;
    });
  };

  // if nobody taps, the story turns its own pages
  useEffect(() => {
    if (page >= LAST) return undefined;
    const t = setTimeout(turn, page === 0 ? 5600 : 6200);
    return () => clearTimeout(t);
  }, [page]);
  useEffect(() => {
    if (page === LAST) sfx.chime(988);
  }, [page]);

  const names = w.hasFrom ? `${w.from} & ${w.name}` : w.name;

  return (
    <Stage className="bg-[#240912] text-[#3b1521]">
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 42%, #5b1a2d 0%, #2a0a16 58%, #12040a 100%)' }} />
      <Drift count={14} seed={13} anim="twinkle" size={[2, 5]} duration={[3, 7]} colors={['#ffd9a0', '#ffc0cb']}>
        {(p) => <span className="block h-full w-full rounded-full" style={{ background: p.color }} />}
      </Drift>

      <Board className="pointer-events-none">
        <div className="absolute left-[9%] top-[11%] h-[78%] w-[82%]" style={{ perspective: '200cqw' }}>
          {/* message (the last page) */}
          <Page i={4} page={page} z={1} style={PAPER}>
            {page >= 4 ? (
              <div className="flex h-full flex-col justify-center px-[7cqw] py-[6cqw] text-center">
                <p className="font-script text-[9cqw] leading-none text-[#a8173f]">The best part…</p>
                <p className="mt-[4cqw] font-hand leading-[1.32]" style={{ fontSize: `${msgSize(w.message, 6.2, 4.4)}cqw` }}>
                  <Typewriter text={w.message} speed={32} cursor={false} />
                </p>
                {w.hasFrom ? <Reveal delay={3600}><p className="mt-[4cqw] font-script text-[8.6cqw] leading-none text-[#a8173f]">Always yours, {w.from}</p></Reveal> : null}
                <Reveal delay={4200}><p className="mt-[3cqw] text-[6cqw]">💗</p></Reveal>
              </div>
            ) : null}
          </Page>

          {[2, 1, 0].map((c) => {
            const i = c + 1;
            return (
              <Page key={i} i={i} page={page} z={LAST - i + 1} style={PAPER}>
                <div className="flex h-full flex-col items-center justify-center px-[7cqw] text-center">
                  <p className="font-playfair text-[3.4cqw] uppercase tracking-[0.4em] text-[#a8173f]/80">Chapter {NUMS[c]}</p>
                  <div className="my-[6cqw] grid h-[34cqw] w-[34cqw] place-items-center rounded-full bg-[#fde3ea] text-[17cqw]" style={{ boxShadow: 'inset 0 0 0 0.8cqw #f4b6c4' }}>{ART[c]}</div>
                  <p className="font-hand leading-[1.15] text-[#3b1521]" style={{ fontSize: `${w.wishes[c].length > 30 ? 7.4 : 8.8}cqw` }}>{w.wishes[c]}</p>
                  <p className="mt-[4cqw] font-script text-[6cqw] text-[#a8173f]/80">{c === 0 ? 'and that is where it began' : c === 1 ? 'and it only got better' : 'and I never looked away'}</p>
                </div>
              </Page>
            );
          })}

          {/* cover */}
          <Page i={0} page={page} z={LAST + 2} style={{ background: 'linear-gradient(135deg, #8d1737 0%, #5e0d25 100%)' }}>
            <div className="absolute inset-[4cqw] rounded-[1.6cqw] border-[0.5cqw] border-[#e8c36a]/80" />
            <div className="relative flex h-full flex-col items-center justify-center px-[8cqw] text-center">
              <p className="font-playfair text-[3.6cqw] uppercase tracking-[0.5em] text-[#e8c36a]">A love story</p>
              <Avatar className="my-[6cqw] h-[38cqw] w-[38cqw] border-[1cqw] border-[#e8c36a]" fallbackClassName="bg-[#e8c36a]" textClassName="font-playfair font-bold text-[#5e0d25]" style={{ boxShadow: '0 0 0 1.2cqw rgba(232,195,106,0.25)' }} />
              <p className="font-script leading-none text-[#ffe9b3]" style={{ fontSize: fitName(names, 13, { width: 62 }) }}>{names}</p>
              {together ? <p className="mt-[3cqw] font-playfair text-[3.6cqw] italic text-[#e8c36a]">{together}</p> : null}
              <Reveal delay={1200}><p className="mt-[8cqw] text-[3.4cqw] tracking-[0.2em] text-[#e8c36a]/80">TAP TO OPEN</p></Reveal>
            </div>
          </Page>
        </div>
      </Board>

      {page < LAST ? <button type="button" aria-label="Turn the page" onClick={turn} className="absolute inset-0 z-[5] cursor-pointer focus:outline-none" tabIndex={-1} /> : null}
    </Stage>
  );
}
