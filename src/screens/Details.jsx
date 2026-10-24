import { useState } from 'react';
import { Back } from '../components/Icons';
import PhotoFrame from './PhotoFrame';

const COPY = {
  birthday: {
    photoTitle: 'Add their photo',
    photoSub: 'Drag to frame the face, like an Instagram profile picture.',
    who: 'Who is it for?',
    name: ['Their name', 'Aisha'],
    age: ['Turning', '24'],
    from: ['From', 'Your name'],
    msgTitle: 'Say something nice',
    msg: 'Wishing you a year as bright as your laugh. Thanks for every adventure.',
    things: ['Three things you love about them', ['Your laugh fills the room', 'You always show up', 'You make plans fun']],
  },
  thanks: {
    photoTitle: 'Add their photo',
    photoSub: 'Drag to frame the face, like an Instagram profile picture.',
    who: 'Who are you thanking?',
    name: ['Their name', 'Aisha'],
    age: null,
    from: ['From', 'Your name'],
    reason: ['What are you thanking them for?', 'your birthday wishes'],
    msgTitle: 'Say it properly',
    msg: 'Thank you for remembering me. Your wishes were the best part of my day.',
    things: ['Three things you appreciate about them', ['You always make time for me', 'Your kindness is contagious', 'You remember the little things']],
  },
  love: {
    photoTitle: 'Add their photo',
    photoSub: 'Drag to frame the face, like an Instagram profile picture.',
    who: 'Who is the lucky one?',
    name: ['Their name', 'Aisha'],
    age: ['Years together', '3'],
    from: ['From', 'Your name'],
    msgTitle: 'Write from the heart',
    msg: 'Every day with you feels like my favourite one. I love you, today and always.',
    things: ['Three things you love about them', ['The way you laugh at my jokes', 'How safe I feel with you', 'Your good-morning texts']],
  },
};

// short "what are you thanking them for?" shortcuts (the sentence reads: "Thank you for ___")
const REASONS = ['your birthday wishes', 'your help', 'the lovely gift', 'being there for me', 'your kind words', 'the amazing party'];

const lab = 'mb-1.5 block px-1 text-[0.8rem] font-medium text-mute';

export default function Details({ draft, set, kind, session, setSession, onBack, onDone }) {
  const [page, setPage] = useState(0);
  const c = COPY[kind] || COPY.birthday;
  const setWish = (i, v) => {
    const wishes = [...draft.wishes];
    wishes[i] = v;
    set({ wishes });
  };

  const back = () => (page === 0 ? onBack() : setPage(page - 1));
  const next = () => (page === 2 ? onDone() : setPage(page + 1));
  const canNext = page !== 1 || draft.name.trim().length > 0;

  const pages = [
    <div key="p0" className="flex flex-col items-center">
      <div className="w-full" style={{ maxWidth: 'min(100%, calc(100cqh - 24rem))' }}>
        <PhotoFrame
          value={draft.photo}
          shape={draft.frame}
          onShape={(frame) => set({ frame })}
          onChange={(photo) => set({ photo })}
          session={session}
          setSession={setSession}
        />
      </div>
    </div>,

    <div key="p1" className="flex flex-col gap-4">
      <div>
        <label htmlFor="wb-name" className={lab}>{c.name[0]}</label>
        <input id="wb-name" className="field" value={draft.name} maxLength={28} placeholder={c.name[1]} autoComplete="off" enterKeyHint="next" onChange={(e) => set({ name: e.target.value })} />
      </div>
      {c.age ? (
        <div className="grid grid-cols-[7.5rem_1fr] gap-3">
          <div>
            <label htmlFor="wb-age" className={lab}>{c.age[0]}</label>
            <input id="wb-age" className="field" inputMode="numeric" value={draft.age} maxLength={3} placeholder={c.age[1]} onChange={(e) => set({ age: e.target.value.replace(/\D/g, '') })} />
          </div>
          <div className="min-w-0">
            <label htmlFor="wb-from" className={lab}>{c.from[0]}</label>
            <input id="wb-from" className="field" value={draft.from} maxLength={28} placeholder={c.from[1]} autoComplete="off" onChange={(e) => set({ from: e.target.value })} />
          </div>
        </div>
      ) : (
        <>
          <div>
            <label htmlFor="wb-from" className={lab}>{c.from[0]}</label>
            <input id="wb-from" className="field" value={draft.from} maxLength={28} placeholder={c.from[1]} autoComplete="off" onChange={(e) => set({ from: e.target.value })} />
          </div>
          {c.reason ? (
            <div>
              <label htmlFor="wb-reason" className={lab}>{c.reason[0]}</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[1rem] text-mute">Thank you for</span>
                <input id="wb-reason" className="field !pl-[8rem]" value={draft.reason} maxLength={40} placeholder={c.reason[1]} autoComplete="off" onChange={(e) => set({ reason: e.target.value })} />
              </div>
              <div className="mt-2.5 flex flex-wrap gap-2" role="group" aria-label="Quick picks">
                {REASONS.map((r) => (
                  <button key={r} type="button" onClick={() => set({ reason: r })} className={`rounded-full px-3 py-1.5 text-[0.82rem] font-medium transition active:scale-95 ${draft.reason === r ? 'bg-accent text-white' : 'bg-black/[0.06] text-ink'}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}
      <p className="px-1 text-[0.85rem] text-mute">{c.age ? 'Age and sender are optional. The scenes skip them when they are empty.' : 'Sender is optional. If you leave the reason empty it says “Thank you for everything”.'}</p>
    </div>,

    <div key="p2" className="flex flex-col gap-4">
      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor="wb-msg" className={lab}>Your message</label>
          <span className="text-xs text-mute">{draft.message.length}/280</span>
        </div>
        <textarea id="wb-msg" className="field min-h-[7.5rem] resize-none" value={draft.message} maxLength={280} placeholder={c.msg} onChange={(e) => set({ message: e.target.value })} />
      </div>
      <fieldset>
        <legend className={lab}>{c.things[0]} (optional)</legend>
        <div className="flex flex-col gap-2.5">
          {[0, 1, 2].map((i) => (
            <input key={i} className="field" value={draft.wishes[i]} maxLength={60} aria-label={`Thing ${i + 1}`} placeholder={c.things[1][i]} onChange={(e) => setWish(i, e.target.value)} />
          ))}
        </div>
      </fieldset>
    </div>,
  ];

  const titles = [c.photoTitle, c.who, c.msgTitle];

  return (
    <div className="flex h-full flex-col pt-[max(0.75rem,env(safe-area-inset-top))]">
      <header className="relative flex h-11 shrink-0 items-center px-3">
        <button type="button" onClick={back} className="btn btn-quiet !h-10 !w-10 !p-0" aria-label="Back">
          <Back width={20} height={20} />
        </button>
        <div className="absolute left-1/2 flex -translate-x-1/2 gap-1.5" aria-label={`Step ${page + 1} of 3`}>
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-1.5 rounded-full bg-ink transition-all duration-500 [transition-timing-function:var(--ease-spring)]" style={{ width: i === page ? 20 : 6, opacity: i === page ? 1 : 0.18 }} />
          ))}
        </div>
      </header>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div
          className="flex h-full w-[300%] transition-transform duration-[600ms] [transition-timing-function:var(--ease-soft-spring)]"
          style={{ transform: `translateX(${-page * (100 / 3)}%)` }}
        >
          {pages.map((el, i) => (
            <section key={i} inert={i !== page} className="no-bar h-full w-1/3 shrink-0 overflow-y-auto px-5 pb-4 pt-3" aria-hidden={i !== page}>
              <h1 className="px-1 text-[2rem] font-bold leading-[1.05] tracking-[-0.035em]">{titles[i]}</h1>
              {i === 0 ? <p className="mb-4 mt-1.5 px-1 text-[0.95rem] leading-snug text-mute">{c.photoSub}</p> : <div className="h-5" />}
              {el}
            </section>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-1 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2">
        <button type="button" className="btn btn-primary !py-[1.05rem] !text-[1.05rem]" disabled={!canNext} onClick={next}>
          {page === 2 ? 'Choose a scene' : page === 0 && !draft.photo ? 'Continue without photo' : 'Next'}
        </button>
      </div>
    </div>
  );
}
